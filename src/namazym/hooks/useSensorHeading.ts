/**
 * Low-latency, fully offline compass heading.
 *
 * The native magnetometer is already calibrated by the platform. We combine it
 * with a lightly smoothed gravity vector for tilt compensation, rotate both
 * vectors into the current screen orientation, and use one adaptive circular
 * filter. Fast turns therefore react immediately while a resting phone remains
 * visually stable. No GPS, network request, or remote service is involved.
 */
import { useEffect, useRef, useState } from 'react';
import { Accelerometer, Magnetometer } from 'expo-sensors';
import * as ScreenOrientation from 'expo-screen-orientation';
import {
    angularDifference,
    CircularEMA,
    fieldMagnitude,
    MagneticFieldTracker,
    rotateVectorForScreen,
    StabilityTracker,
    tiltCompensatedHeading,
    type FieldQuality,
    type ScreenRotation,
} from '../utils/kyblaUtils';

export interface SensorHeadingResult {
    /** Raw tilt-compensated magnetic heading before smoothing. */
    rawHeading: number;
    /** Responsive, smoothed magnetic heading in degrees 0–360. */
    heading: number;
    /** Continuous heading for animation without a 0/360 snap. */
    headingUnwrapped: number;
    /** Phone tilt from horizontal in degrees (0 = flat, 90 = upright). */
    tiltDeg: number;
    /** Circular stability score from 0–1. */
    stability: number;
    /** Number of valid compass samples received. */
    sampleCount: number;
    /** Strength of the measured magnetic field in microtesla. */
    fieldStrength: number;
    /** max−min of the field strength across the recent window, in microtesla. */
    fieldSpread: number;
    /** Whether the magnetic field can be trusted to give a true direction. */
    fieldQuality: FieldQuality;
}

type Vector3 = { x: number; y: number; z: number };

const UPDATE_MS = 40; // 25 Hz is fluid on-screen without redrawing at sensor maximum speed.
const GRAVITY_ALPHA = 0.18;
const MICRO_JITTER_DEG = 0.18;

function orientationToRotation(orientation: ScreenOrientation.Orientation): ScreenRotation | null {
    switch (orientation) {
        case ScreenOrientation.Orientation.PORTRAIT_UP:
            return 0;
        case ScreenOrientation.Orientation.PORTRAIT_DOWN:
            return 180;
        case ScreenOrientation.Orientation.LANDSCAPE_LEFT:
            return 90;
        case ScreenOrientation.Orientation.LANDSCAPE_RIGHT:
            return -90;
        default:
            return null;
    }
}

function smoothingAlpha(deltaDeg: number): number {
    if (deltaDeg >= 18) return 0.86;
    if (deltaDeg >= 7) return 0.68;
    if (deltaDeg >= 2) return 0.44;
    return 0.24;
}

export function useSensorHeading(): SensorHeadingResult {
    const [result, setResult] = useState<SensorHeadingResult>({
        rawHeading: 0,
        heading: 0,
        headingUnwrapped: 0,
        tiltDeg: 0,
        stability: 0,
        sampleCount: 0,
        fieldStrength: 0,
        fieldSpread: 0,
        fieldQuality: 'unknown',
    });

    const gravityRef = useRef<Vector3>({ x: 0, y: 0, z: 1 });
    const hasGravityRef = useRef(false);
    const screenRotationRef = useRef<ScreenRotation>(0);
    const smootherRef = useRef(new CircularEMA(0.24));
    const stabilizerRef = useRef(new StabilityTracker(14));
    const fieldTrackerRef = useRef(new MagneticFieldTracker());
    const lastUnwrappedRef = useRef(0);
    const sampleCountRef = useRef(0);
    const initializedRef = useRef(false);

    useEffect(() => {
        let active = true;
        let accelerometerSubscription: ReturnType<typeof Accelerometer.addListener> | null = null;
        let magnetometerSubscription: ReturnType<typeof Magnetometer.addListener> | null = null;

        const resetForOrientation = (rotation: ScreenRotation) => {
            if (screenRotationRef.current === rotation) return;
            screenRotationRef.current = rotation;
            smootherRef.current.reset();
            stabilizerRef.current.reset();
            hasGravityRef.current = false;
            initializedRef.current = false;
        };

        const orientationSubscription = ScreenOrientation.addOrientationChangeListener(event => {
            const rotation = orientationToRotation(event.orientationInfo.orientation);
            if (rotation !== null) resetForOrientation(rotation);
        });

        const start = async () => {
            try {
                const [orientation, hasAccelerometer, hasMagnetometer] = await Promise.all([
                    ScreenOrientation.getOrientationAsync(),
                    Accelerometer.isAvailableAsync(),
                    Magnetometer.isAvailableAsync(),
                ]);

                if (!active || !hasAccelerometer || !hasMagnetometer) return;

                const initialRotation = orientationToRotation(orientation);
                if (initialRotation !== null) screenRotationRef.current = initialRotation;

                Accelerometer.setUpdateInterval(UPDATE_MS);
                Magnetometer.setUpdateInterval(UPDATE_MS);

                accelerometerSubscription = Accelerometer.addListener(data => {
                    const next = rotateVectorForScreen(
                        data.x,
                        data.y,
                        data.z,
                        screenRotationRef.current,
                    );

                    if (!hasGravityRef.current) {
                        gravityRef.current = next;
                        hasGravityRef.current = true;
                        return;
                    }

                    const previous = gravityRef.current;
                    gravityRef.current = {
                        x: previous.x + GRAVITY_ALPHA * (next.x - previous.x),
                        y: previous.y + GRAVITY_ALPHA * (next.y - previous.y),
                        z: previous.z + GRAVITY_ALPHA * (next.z - previous.z),
                    };
                });

                magnetometerSubscription = Magnetometer.addListener(data => {
                    if (!active) return;

                    // |B| is independent of how the phone or the screen is turned,
                    // so it is measured on the raw vector and keeps accumulating
                    // across orientation changes.
                    const field = fieldTrackerRef.current.add(
                        fieldMagnitude(data.x, data.y, data.z),
                    );

                    if (!hasGravityRef.current) return;

                    const magnetic = rotateVectorForScreen(
                        data.x,
                        data.y,
                        data.z,
                        screenRotationRef.current,
                    );
                    const gravity = gravityRef.current;
                    const { heading: rawHeading, tiltDeg } = tiltCompensatedHeading(
                        magnetic.x,
                        magnetic.y,
                        magnetic.z,
                        gravity.x,
                        gravity.y,
                        gravity.z,
                    );

                    if (!Number.isFinite(rawHeading)) return;

                    const lastHeading = (lastUnwrappedRef.current % 360 + 360) % 360;
                    const rawDelta = initializedRef.current
                        ? Math.abs(angularDifference(lastHeading, rawHeading))
                        : 180;
                    let smoothed = smootherRef.current.smooth(rawHeading, smoothingAlpha(rawDelta));

                    if (!initializedRef.current) {
                        lastUnwrappedRef.current = smoothed;
                        initializedRef.current = true;
                    } else {
                        let delta = angularDifference(lastHeading, smoothed);
                        if (Math.abs(delta) < MICRO_JITTER_DEG) {
                            smoothed = lastHeading;
                            delta = 0;
                        }
                        lastUnwrappedRef.current += delta;
                    }

                    const heading = (smoothed % 360 + 360) % 360;
                    const stability = stabilizerRef.current.add(heading);
                    sampleCountRef.current += 1;

                    setResult({
                        rawHeading,
                        heading,
                        headingUnwrapped: lastUnwrappedRef.current,
                        tiltDeg,
                        stability,
                        sampleCount: sampleCountRef.current,
                        fieldStrength: field.magnitude,
                        fieldSpread: field.spread,
                        fieldQuality: field.quality,
                    });
                });
            } catch {
                // Keep the screen in its calibration state on unsupported/broken
                // hardware. No sensor values or device details are logged.
            }
        };

        void start();

        return () => {
            active = false;
            orientationSubscription.remove();
            accelerometerSubscription?.remove();
            magnetometerSubscription?.remove();
        };
    }, []);

    return result;
}
