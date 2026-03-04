/**
 * useSolarDynamics — Continuous solar position + prayer breath system.
 *
 * Two concerns:
 *
 * 1. solarProgress [0..1]      — updated every 30s
 *    = (now - fajrMs) / (maghribMs - fajrMs), clamped [0,1]
 *    Drives Sun disk X/Y interpolation in Rive and gradient fallback.
 *
 * 2. timeToNextPrayer01 [0..1] — updated every 15s
 *    = remainingMs / intervalMs, clamped [0,1]
 *    1 = just after current prayer (lots of time)
 *    0 = next prayer is imminent
 *
 * 3. breathIntensity [0..1]    — derived from timeToNextPrayer01 + motionIntensity
 *    = lerp(0.08, 0.22, easeInOutCubic(1 - timeToNextPrayer01)) * motionIntensity
 *    Breathing is subtle; strongest only moments before the next prayer.
 *
 * Guardrails:
 *   - If prayer times unavailable → solarProgress=0.5, breathIntensity=0, timeToNextPrayer01=1
 *   - If motionIntensity=0 (STATIC / reducedMotion) → breathIntensity=0
 *   - Max extra opacity from breathing: 0.04 (enforced in RiveAtmosphereBackground)
 */

import { useEffect, useRef, useState } from 'react';

// ─── Time parsing ──────────────────────────────────────────────────────────────
/**
 * Parse a "HH:MM" string to today's millisecond timestamp, or null.
 */
function parseTimeToMs(timeStr: string | undefined | null): number | null {
    if (!timeStr) return null;
    const parts = timeStr.split(':');
    if (parts.length < 2) return null;
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return null;
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d.getTime();
}

// ─── easeInOutCubic ───────────────────────────────────────────────────────────
function easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function clamp(v: number, lo: number, hi: number) {
    return Math.min(Math.max(v, lo), hi);
}
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

// ─── Props ────────────────────────────────────────────────────────────────────
interface PrayerTimesForSolar {
    fajr?: string;    // "HH:MM"
    maghrib?: string;    // "HH:MM"
    /** The current and next prayer times in "HH:MM" format */
    currentTime?: string;
    nextTime?: string;
}

interface SolarDynamicsOptions {
    motionIntensity: number;
    prayerTimes?: PrayerTimesForSolar;
    isStaticMode?: boolean;   // true when motionStyle=STATIC or reducedMotion
}

interface SolarDynamicsResult {
    solarProgress: number;  // [0..1] sun position through the day
    timeToNextPrayer01: number;  // [0..1] 1=just started, 0=imminent
    breathIntensity: number;  // [0..1] scaled breath pulse amplitude
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useSolarDynamics({
    motionIntensity,
    prayerTimes,
    isStaticMode = false,
}: SolarDynamicsOptions): SolarDynamicsResult {

    const [solarProgress, setSolarProgress] = useState(0.5);
    const [timeToNextPrayer01, setTimeToNextPrayer01] = useState(1.0);
    const [breathIntensity, setBreathIntensity] = useState(0.0);

    // ── Compute solarProgress ─────────────────────────────────────────────────
    const computeSolar = () => {
        const fajrMs = parseTimeToMs(prayerTimes?.fajr);
        const maghribMs = parseTimeToMs(prayerTimes?.maghrib);
        if (fajrMs === null || maghribMs === null || maghribMs <= fajrMs) return;

        const now = Date.now();
        const progress = clamp((now - fajrMs) / (maghribMs - fajrMs), 0, 1);
        setSolarProgress(progress);
    };

    // ── Compute timeToNextPrayer01 + breathIntensity ──────────────────────────
    const computeBreath = () => {
        const currentMs = parseTimeToMs(prayerTimes?.currentTime);
        const nextMs = parseTimeToMs(prayerTimes?.nextTime);

        if (currentMs === null || nextMs === null || nextMs <= currentMs) {
            setTimeToNextPrayer01(1.0);
            setBreathIntensity(0.0);
            return;
        }

        const now = Date.now();
        const remaining = Math.max(0, nextMs - now);
        const interval = nextMs - currentMs;
        const t01 = clamp(remaining / interval, 0, 1);
        setTimeToNextPrayer01(t01);

        if (isStaticMode || motionIntensity === 0) {
            setBreathIntensity(0);
            return;
        }

        // breathIntensity: subtle base, grows only near next prayer
        const rawBreath = lerp(0.08, 0.22, easeInOutCubic(1 - t01));
        setBreathIntensity(clamp(rawBreath * motionIntensity, 0, 0.22));
    };

    // ── Intervals ─────────────────────────────────────────────────────────────
    useEffect(() => {
        computeSolar();
        computeBreath();

        const solarId = setInterval(computeSolar, 30_000);
        const breathId = setInterval(computeBreath, 15_000);

        return () => {
            clearInterval(solarId);
            clearInterval(breathId);
        };
    }, [prayerTimes?.fajr, prayerTimes?.maghrib, prayerTimes?.currentTime, prayerTimes?.nextTime]);

    // Re-derive breathIntensity when motionIntensity changes (no interval needed)
    useEffect(() => {
        if (isStaticMode || motionIntensity === 0) {
            setBreathIntensity(0);
            return;
        }
        const rawBreath = lerp(0.08, 0.22, easeInOutCubic(1 - timeToNextPrayer01));
        setBreathIntensity(clamp(rawBreath * motionIntensity, 0, 0.22));
    }, [motionIntensity, isStaticMode]);

    return { solarProgress, timeToNextPrayer01, breathIntensity };
}
