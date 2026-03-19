/**
 * useQiblaState — compass state machine with anti-jitter guard & haptics.
 *
 * Anti-jitter rules:
 *   - State is only committed after being stable for MIN_STATE_HOLD_MS
 *   - Downgrade (toward calibrating/unstable) happens immediately
 *   - Haptics fire only on state *entry*, not on repeated same-state updates
 *   - Celebration feedback requires stability ≥ THR_STABILITY_HIGH
 *   - Minimum stable duration before success haptic: MIN_STABLE_FOR_CELEBRATE_MS
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
    resolveCompassState,
    getStateInfo,
    angularDifference,
    THR_STABILITY_HIGH,
    type CompassState,
    type CompassStateInfo,
} from '../utils/kyblaUtils';

const MIN_STATE_HOLD_MS = 500;   // candidate must persist this long before commit
const MIN_STABLE_FOR_CELEBRATE_MS = 600;   // must be stable this long before success haptic
const HAPTIC_COOLDOWN_NEAR_MS = 1500;
const HAPTIC_COOLDOWN_PERFECT_MS = 2500;

export interface QiblaStateResult {
    state: CompassState;
    stateInfo: CompassStateInfo;
    diff: number;   // absolute shortest angular difference (0–180)
}

interface Props {
    heading: number;
    bearing: number;
    stability: number;
    tiltDeg: number;
    sampleCount: number;
}

export function useQiblaState({ heading, bearing, stability, tiltDeg, sampleCount }: Props): QiblaStateResult {
    const diff = Math.abs(angularDifference(heading, bearing));

    const [committed, setCommitted] = useState<CompassState>('calibrating');

    // Anti-jitter: candidate + timer
    const candidateRef = useRef<CompassState>('calibrating');
    const candidateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Haptic guards
    const lastHapticNear = useRef(0);
    const lastHapticPerfect = useRef(0);
    const stableStartRef = useRef(0);
    const lastStableRef = useRef(false);

    // Track when heading became stable (for min-stable-before-celebrate)
    useEffect(() => {
        const isStable = stability >= THR_STABILITY_HIGH;
        if (isStable && !lastStableRef.current) {
            stableStartRef.current = Date.now();
        }
        lastStableRef.current = isStable;
    }, [stability]);

    const resolvedCandidate = resolveCompassState(committed, diff, stability, tiltDeg, sampleCount);

    useEffect(() => {
        // Downgrade states apply immediately (user needs instant feedback)
        const isDowngrade =
            resolvedCandidate === 'calibrating' ||
            resolvedCandidate === 'hold_flat' ||
            resolvedCandidate === 'unstable';

        if (isDowngrade) {
            candidateTimer.current && clearTimeout(candidateTimer.current);
            candidateTimer.current = null;
            candidateRef.current = resolvedCandidate;
            setCommitted(resolvedCandidate);
            return;
        }

        // Upgrade states: debounce by MIN_STATE_HOLD_MS
        if (resolvedCandidate !== candidateRef.current) {
            candidateRef.current = resolvedCandidate;
            candidateTimer.current && clearTimeout(candidateTimer.current);
            candidateTimer.current = setTimeout(() => {
                setCommitted(resolvedCandidate);
            }, MIN_STATE_HOLD_MS);
        }

        return () => {
            // Note: don't clear timer on every re-render; only clear when candidate changes
        };
    }, [resolvedCandidate]);

    // Haptics — fire on state entry with cooldown + stability gate
    const prevState = useRef<CompassState>('calibrating');
    useEffect(() => {
        if (Platform.OS === 'web') return;
        if (committed === prevState.current) return;

        const now = Date.now();
        const stableDuration = now - stableStartRef.current;

        if (committed === 'near' && now - lastHapticNear.current > HAPTIC_COOLDOWN_NEAR_MS) {
            if (stability >= THR_STABILITY_HIGH) {
                lastHapticNear.current = now;
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
        }

        if (committed === 'perfect' && now - lastHapticPerfect.current > HAPTIC_COOLDOWN_PERFECT_MS) {
            if (stability >= THR_STABILITY_HIGH && stableDuration >= MIN_STABLE_FOR_CELEBRATE_MS) {
                lastHapticPerfect.current = now;
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
        }

        prevState.current = committed;
    }, [committed, stability]);

    return {
        state: committed,
        stateInfo: getStateInfo(committed, diff),
        diff,
    };
}
