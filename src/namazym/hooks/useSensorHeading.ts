/**
 * useSensorHeading — dual-sensor heading with fusion, tilt compensation & stability score.
 *
 * Architecture:
 *   Accelerometer (50 ms)  → accelRef (gravity vector for tilt compensation)
 *   Gyroscope     (50 ms)  → gyroRef (angular velocity for short-term prediction)
 *   Magnetometer  (50 ms)  → tiltCompensatedHeading(mag, accel)
 *                          → KalmanHeadingFilter (remove magnetic noise)
 *                          → HeadingFusion (fuse gyro prediction + mag correction)
 *                          → CircularEMA (smooth fused result)
 *                          → Micro-Jitter Guard (ignore < 0.6° changes)
 *                          → StabilityTracker (circular variance on rendered output)
 *                          → emits { rawHeading, heading, headingUnwrapped, tiltDeg, stability, sampleCount }
 */
import { useState, useEffect, useRef } from 'react';
import { Accelerometer, Magnetometer, Gyroscope } from 'expo-sensors';
import {
    CircularEMA,
    StabilityTracker,
    tiltCompensatedHeading,
} from '../utils/kyblaUtils';
import { KalmanHeadingFilter } from '../utils/kalmanHeading';
import { HeadingFusion } from '../utils/headingFusion';

export interface SensorHeadingResult {
    /** Raw tilt-compensated magnetometer heading before any fusion/smoothing */
    rawHeading: number;
    /** Final fused, smoothed, and micro-jitter guarded heading in degrees 0–360 */
    heading: number;
    /** Unwrapped heading for continuous timing animation (no 0/360 snap) */
    headingUnwrapped: number;
    /** Phone tilt from horizontal in degrees (0 = flat) */
    tiltDeg: number;
    /** Circular-variance stability score 0–1 */
    stability: number;
    /** Total samples collected (used to gate 'calibrating' state) */
    sampleCount: number;
}

const UPDATE_MS = 33; // ~30 Hz — improves responsiveness with modest battery cost

export function useSensorHeading(): SensorHeadingResult {
    const [result, setResult] = useState<SensorHeadingResult>({
        rawHeading: 0,
        heading: 0,
        headingUnwrapped: 0,
        tiltDeg: 0,
        stability: 0,
        sampleCount: 0,
    });

    // Refs — avoid stale closures in sensor callbacks
    const accelRef = useRef({ x: 0, y: 0, z: 9.8 });
    const gyroRef = useRef({ x: 0, y: 0, z: 0 });
    const gyroLastTimeRef = useRef<number>(0);

    const smoother = useRef(new CircularEMA(0.30)).current;
    const stabilizer = useRef(new StabilityTracker(20)).current;
    const kalmanFilter = useRef(new KalmanHeadingFilter(0.015, 3.0)).current;
    const fusionEngine = useRef(new HeadingFusion(0.05)).current;

    const lastFusionTime = useRef(0);
    const lastUnwrapped = useRef(0);
    const sampleCountRef = useRef(0);
    const initializedRef = useRef(false);

    useEffect(() => {
        Accelerometer.setUpdateInterval(UPDATE_MS);
        Magnetometer.setUpdateInterval(UPDATE_MS);
        Gyroscope.setUpdateInterval(UPDATE_MS);

        const accSub = Accelerometer.addListener(data => {
            accelRef.current = data;
        });

        const gyroSub = Gyroscope.addListener(data => {
            gyroRef.current = data;
            gyroLastTimeRef.current = Date.now();
        });

        const magSub = Magnetometer.addListener(mag => {
            const now = Date.now();
            const dt = lastFusionTime.current ? (now - lastFusionTime.current) / 1000 : 0;
            lastFusionTime.current = now;

            // Gyro freshness check (active if updated in the last 250ms)
            const hasGyro = (now - gyroLastTimeRef.current) < 250;

            const { x: ax, y: ay, z: az } = accelRef.current;
            const { x: gx, y: gy, z: gz } = gyroRef.current;

            const { heading: rawMag, tiltDeg } = tiltCompensatedHeading(
                mag.x, mag.y, mag.z,
                ax, ay, az,
            );

            // Skip degenerate sensor reading
            if (isNaN(rawMag)) return;

            // Pipeline Step 1: Kalman Filter (removes base magnetic noise)
            const kalmanFiltered = kalmanFilter.update(rawMag);

            // Pipeline Step 2: Gyroscope Fusion
            // Project gyro onto gravity vector to get robust rotation rate regardless of tilt
            const aMag = Math.sqrt(ax * ax + ay * ay + az * az) || 1;
            const verticalRotationRateRads = (gx * ax + gy * ay + gz * az) / aMag;
            const verticalRotationRateDegs = verticalRotationRateRads * (180 / Math.PI);

            const fusedHeading = fusionEngine.update(
                kalmanFiltered,
                verticalRotationRateDegs,
                dt,
                hasGyro
            );

            // Pipeline Step 3: Circular EMA smoothing
            let smoothed = smoother.smooth(fusedHeading);

            // First-frame initialization to prevent 0° jump animation
            if (!initializedRef.current) {
                lastUnwrapped.current = smoothed;
                initializedRef.current = true;
            } else {
                // Pipeline Step 4: Micro-jitter guard (ignore changes < 0.4°)
                const lastSmoothed = (lastUnwrapped.current % 360 + 360) % 360;
                let delta = smoothed - lastSmoothed;
                if (delta > 180) delta -= 360;
                if (delta < -180) delta += 360;

                if (Math.abs(delta) < 0.4) {
                    smoothed = lastSmoothed;
                    delta = 0;
                }

                // Unwrap: maintain continuous rotation for animation
                lastUnwrapped.current += delta;
            }

            // Pipeline Step 5: Stability tracking (measured on final rendered outcome)
            const stability = stabilizer.add(smoothed);
            sampleCountRef.current += 1;

            // Normalize final heading to strict 0-360 range
            const headingNormalized = (smoothed % 360 + 360) % 360;

            setResult({
                rawHeading: rawMag, // Now correctly returns the raw magnetometer truth
                heading: headingNormalized,
                headingUnwrapped: lastUnwrapped.current,
                tiltDeg,
                stability,
                sampleCount: sampleCountRef.current,
            });
        });

        return () => {
            accSub.remove();
            magSub.remove();
            gyroSub.remove();
        };
    }, [smoother, stabilizer, kalmanFilter, fusionEngine]);

    return result;
}
