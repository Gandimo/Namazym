/**
 * useMotionGovernor — Unified adaptive motion intensity governor.
 *
 * Combines three constraint sources into a single [0..1] motionIntensity value:
 *   1. User style setting  (Static=0 / Subtle=0.55 / Atmosphere=1.0)
 *   2. Battery level       (via expo-battery, imperative polling only)
 *   3. FPS                 (from usePerformanceGovernor, passed as fpsValue)
 *   (Thermal: graceful default 1.0 — native module unavailable in Expo Go)
 *
 * Formula:
 *   rawIntensity = min(userCap, batteryCap, fpsCap, 1.0)
 *   motionIntensity = lerp(prev, rawIntensity, α=0.08)  ← smooth, no flicker
 *
 * Motion Style persisted in AsyncStorage key 'namazym_motion_style'.
 * Default: 'SUBTLE'
 *
 * RULES OF HOOKS:
 *   - All hooks (useState, useEffect, useRef, useCallback) are unconditional.
 *   - Battery polling is purely imperative — no conditional hook calls.
 *   - If expo-battery is unavailable, batteryCap defaults to 1.0.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Safe battery import (may fail in some environments) ───────────────────────
let Battery: any = null;
try {
    Battery = require('expo-battery');
} catch {
    Battery = null;
}

export type MotionStyle = 'STATIC' | 'SUBTLE' | 'ATMOSPHERE';

const MOTION_STYLE_KEY = 'namazym_motion_style';
const LERP_ALPHA = 0.08;

// ─── User style caps ──────────────────────────────────────────────────────────
const USER_CAP: Record<MotionStyle, number> = {
    STATIC: 0.00,
    SUBTLE: 0.55,
    ATMOSPHERE: 1.00,
};

// ─── Battery caps (pure function, no hooks) ───────────────────────────────────
function getBatteryCap(level: number, charging: boolean): number {
    let cap: number;
    if (level >= 0.50) cap = 1.00;
    else if (level >= 0.20) cap = 0.85;
    else cap = 0.65;
    if (charging) cap = Math.min(cap + 0.05, 1.0);
    return cap;
}

// ─── FPS cap (pure function, matches usePerformanceGovernor thresholds) ────────
export function fpsToCap(fps: number): number {
    if (fps >= 50) return 1.00;
    if (fps >= 38) return 0.75;
    return 0.55;
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

// ─── Hook ─────────────────────────────────────────────────────────────────────
interface MotionGovernorResult {
    motionIntensity: number;       // [0..1] smooth output — main prop to pass down
    motionStyle: MotionStyle;
    setMotionStyle: (style: MotionStyle) => Promise<void>;
}

export function useMotionGovernor(fpsValue: number = 60): MotionGovernorResult {
    // All useState hooks — unconditional, always in the same order
    const [motionStyle, _setMotionStyle] = useState<MotionStyle>('SUBTLE');
    const [batteryCap, setBatteryCap] = useState(1.0);
    const [motionIntensity, setMotionIntensity] = useState(USER_CAP['SUBTLE']);

    // Smooth output tracker (ref — doesn't trigger re-render)
    const smoothed = useRef(USER_CAP['SUBTLE']);

    // ── Load persisted style ──────────────────────────────────────────────────
    useEffect(() => {
        AsyncStorage.getItem(MOTION_STYLE_KEY).then(v => {
            if (v === 'STATIC' || v === 'SUBTLE' || v === 'ATMOSPHERE') {
                _setMotionStyle(v);
            }
        }).catch(() => { });
    }, []);

    // ── Battery polling (imperative, no conditional hooks) ───────────────────
    useEffect(() => {
        if (!Battery) return; // expo-battery unavailable — keep default cap 1.0

        let mounted = true;
        let sub1: any = null;
        let sub2: any = null;

        async function init() {
            try {
                const [level, state] = await Promise.all([
                    Battery.getBatteryLevelAsync(),
                    Battery.getBatteryStateAsync(),
                ]);
                if (!mounted) return;
                const charging = state === Battery.BatteryState.CHARGING ||
                    state === Battery.BatteryState.FULL;
                setBatteryCap(getBatteryCap(level, charging));

                sub1 = Battery.addBatteryLevelListener(({ batteryLevel }: any) => {
                    if (!mounted) return;
                    Battery.getBatteryStateAsync().then((s: any) => {
                        if (!mounted) return;
                        const ch = s === Battery.BatteryState.CHARGING || s === Battery.BatteryState.FULL;
                        setBatteryCap(getBatteryCap(batteryLevel, ch));
                    }).catch(() => { });
                });

                sub2 = Battery.addBatteryStateListener(({ batteryState }: any) => {
                    if (!mounted) return;
                    Battery.getBatteryLevelAsync().then((lv: any) => {
                        if (!mounted) return;
                        const ch = batteryState === Battery.BatteryState.CHARGING ||
                            batteryState === Battery.BatteryState.FULL;
                        setBatteryCap(getBatteryCap(lv, ch));
                    }).catch(() => { });
                });
            } catch {
                // Battery API unavailable — remain at default cap 1.0
            }
        }

        init();
        return () => {
            mounted = false;
            sub1?.remove();
            sub2?.remove();
        };
    }, []); // runs once on mount

    // ── Smooth motionIntensity whenever constraints change ────────────────────
    useEffect(() => {
        const userCap = USER_CAP[motionStyle];
        const fpsCap = fpsToCap(fpsValue);
        const thermalCap = 1.0; // graceful default
        const raw = Math.min(userCap, batteryCap, fpsCap, thermalCap);

        // Snap instantly to 0 for STATIC — no lerp lag
        if (motionStyle === 'STATIC') {
            smoothed.current = 0;
            setMotionIntensity(0);
            return;
        }

        // Exponential smooth using a fixed-interval stepping loop
        let running = true;
        let steps = 0;
        const MAX_STEPS = 120; // ~2 s
        const id = setInterval(() => {
            if (!running) return;
            steps++;
            const next = lerp(smoothed.current, raw, LERP_ALPHA);
            smoothed.current = next;
            setMotionIntensity(parseFloat(next.toFixed(3)));
            if (steps >= MAX_STEPS || Math.abs(next - raw) < 0.002) {
                running = false;
                clearInterval(id);
            }
        }, 16);

        return () => {
            running = false;
            clearInterval(id);
        };
    }, [motionStyle, batteryCap, fpsValue]);

    // ── Setter with AsyncStorage persistence ──────────────────────────────────
    const setMotionStyle = useCallback(async (style: MotionStyle) => {
        _setMotionStyle(style);
        try { await AsyncStorage.setItem(MOTION_STYLE_KEY, style); } catch { }
    }, []);

    return { motionIntensity, motionStyle, setMotionStyle };
}
