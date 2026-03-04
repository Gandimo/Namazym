/**
 * RiveAtmosphereBackground V3 — Unified adaptive motion atmosphere.
 *
 * Rive contract (home_atmosphere.riv / HomeAtmosphereSM):
 *   currentPrayer       number 0-4
 *   scrollSpeedFar      number 0-1   (Far   = scrollSpeed01 × 0.70)
 *   scrollSpeedMid      number 0-1   (Mid   = scrollSpeed01 × 0.85)
 *   scrollSpeedNear     number 0-0.55 (Near = clamp(scrollSpeed01, 0, 0.55))
 *   motionIntensity     number 0-1   (unified governor output)
 *   solarProgress       number 0-1   (Fajr→Maghrib sun interpolation)
 *   timeToNextPrayer01  number 0-1   (1=just started, 0=imminent)
 *   breathIntensity     number 0-1   (breathing pulse scale)
 *
 * Depth mask zones (applied to gradient fallback layer opacities):
 *   top  [0.00-0.22] → 1.00
 *   ui   [0.22-0.68] → 0.42
 *   bot  [0.68-1.00] → 0.72
 *
 * Failure modes:
 *   - rive-react-native unavailable (Expo Go) → gradient fallback
 *   - Rive .riv load error → gradient fallback
 *   - reducedMotion → static gradient, no animations
 *
 * HOW TO ACTIVATE RIVE:
 *   1. Place home_atmosphere.riv in android/app/src/main/assets/
 *      and ios/<AppName>/home_atmosphere.riv
 *   2. Run `npx expo run:ios` or `npx expo run:android` (dev build)
 */

import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Animated, Easing, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getTierMultipliers, type PerformanceTier } from '../hooks/usePerformanceGovernor';
import { SkyEngineV3 } from './SkyEngineV3';
import { BirdsEngineV3 } from './BirdsEngineV3';
import { AtmosphereLayer } from './AtmosphereLayer';

// ── Try to import rive-react-native (not available in Expo Go) ───────────────
let Rive: any = null;
try {
    Rive = require('rive-react-native').default;
} catch {
    Rive = null;
}

const { width: SW, height: SH } = Dimensions.get('window');

export type PrayerIndex = 0 | 1 | 2 | 3 | 4;

// ─── DEBUG FLAG —──────────────────────────────────────────────────────────
// PRODUCTION-SAFE: __DEV__ guard makes this FALSE in all release builds.
// Even if inner value is accidentally left as `true`, production will ignore it.
// TEST 1: scrim → opacity 0  |  TEST 2: vivid debug colors  |  TEST 3: zIndex 999
// HOW TO USE: Change inner `false` to `true` ONLY during local dev. Never commit true.
const DEBUG_DECO = __DEV__ && false;

// ─── Guardrail caps ───────────────────────────────────────────────────────────
const CAP = {
    kaaba: 0.14, stars: 0.28, sunGlow: 0.22,
    lightSweep: 0.10, birdsNear: 0.08, breathExtra: 0.04,
};

// ─── Decorative layer constants (Layer B) ─────────────────────────────────────
// Birds and Kaaba are PRAYER-INDEPENDENT. They use only motionIntensity.
// Formula: Math.max(FLOOR, motionIntensity * BASE)
// Layer B is NEVER driven by per-prayer s.bF / s.kOp values.
const DECO = {
    KAABA_FLOOR: 0.07,  // always visible at 7% min
    KAABA_BASE: 0.12,  // full motionIntensity target
} as const;

// ─── Prayer-State Test Matrix ──────────────────────────────────────────────
// mi=0 → Kaaba=0.070, BirdsF=0.100 (Guaranteed Floor)
// mi=1 → Kaaba=0.120 consistently
// mi=1 → BirdsF varies by prayer:
//   Fajr:    0.133 (0.14 * 0.95)
//   Dhuhr:   0.154 (0.14 * 1.10)
//   Asr:     0.147 (0.14 * 1.05)
//   Maghrib: 0.119 (0.14 * 0.85)
//   Isha:    0.100 (0.14 * 0.65 -> clamped to FLOOR)

// ─── Scroll speed clamping (spec §birds_near_clamp) ──────────────────────────
function splitScroll(speed01: number) {
    return {
        far: Math.min(speed01 * 0.70, 1.0),
        mid: Math.min(speed01 * 0.85, 1.0),
        near: Math.min(speed01, 0.55),
    };
}

// ─── Props ────────────────────────────────────────────────────────────────────
export interface AtmosphereProps {
    currentPrayerIndex: PrayerIndex;
    scrollSpeed01: number;   // 0-1 (capped 0.85 upstream)
    scrollDepth01: number;   // 0-1 (depth mask)
    motionIntensity: number;   // 0-1 (unified governor)
    solarProgress: number;   // 0-1 (sun position)
    timeToNextPrayer01: number;   // 0-1 (breath trigger)
    breathIntensity: number;   // 0-1 (breath pulse scale)
    transitionStep?: Animated.Value; // 0-1 over 90s (V15)
    reducedMotion?: boolean;
}

// ─── Depth mask ───────────────────────────────────────────────────────────────
function smoothstep(e0: number, e1: number, x: number) {
    const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
    return t * t * (3 - 2 * t);
}
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

const fmt = (n: any) => (typeof n === 'number' && isFinite(n) ? n.toFixed(3) : 'NA');

function getZoneMult(posY: number) {
    if (posY <= 0.22) return 1.00;
    if (posY >= 0.68) return 0.72;
    return lerp(1.00, 0.42, smoothstep(0.22, 0.68, posY));
}

function dm(posY: number, base: number, fr: number, cap?: number, boost?: number) {
    let zm = getZoneMult(posY);
    if (boost && posY > 0.68) zm = Math.min(zm * boost, 1.0);
    const v = base * lerp(1.0, zm, fr);
    return cap !== undefined && posY > 0.22 && posY < 0.68
        ? Math.min(v, cap) : Math.max(0, v);
}

const FR = { stars: 0.82, moon: 0.55, kaaba: 0.55, sweep: 0.60 };
const UICAP = { stars: 0.12, kaaba: 0.18 };

// ─── Solar interpolation (gradient fallback sun posY) ────────────────────────
function solarSunY(progress: number): number {
    // Arc: 0.78 (dawn) → 0.28 (noon) → 0.74 (dusk)
    if (progress <= 0.5) return lerp(0.78, 0.28, progress * 2);
    return lerp(0.28, 0.74, (progress - 0.5) * 2);
}

// ─── Per-prayer state spec (V1 tuning) ───────────────────────────────────────
const FALLBACK_STATE = {
    0: { grad: 'ertir', driftPx: 6, driftS: 20, sunOpY: [0.10, 0.78], glowOpY: [0.16, 0.80], glowScale: 1.10, pulseAmp: 0.03, pulseS: 9, starsOp: 0.06, tAmp: 0.02, tSp: 0.25, moonOp: 0.00, bF: 0.15, bM: 0.08, bN: 0.05, kOp: 0.10, swOp: 0.04, swW: 0.55 },
    1: { grad: 'oyle', driftPx: 5, driftS: 22, sunOpY: [0.12, 0.30], glowOpY: [0.12, 0.32], glowScale: 1.05, pulseAmp: 0.02, pulseS: 10, starsOp: 0.00, tAmp: 0, tSp: 0, moonOp: 0.00, bF: 0.20, bM: 0.05, bN: 0.03, kOp: 0.09, swOp: 0.03, swW: 0.52 },
    2: { grad: 'oyle', driftPx: 6, driftS: 20, sunOpY: [0.11, 0.40], glowOpY: [0.14, 0.42], glowScale: 1.08, pulseAmp: 0.03, pulseS: 9, starsOp: 0.00, tAmp: 0, tSp: 0, moonOp: 0.00, bF: 0.18, bM: 0.07, bN: 0.04, kOp: 0.10, swOp: 0.05, swW: 0.58 },
    3: { grad: 'yatsy', driftPx: 7, driftS: 18, sunOpY: [0.09, 0.72], glowOpY: [0.18, 0.75], glowScale: 1.14, pulseAmp: 0.04, pulseS: 8, starsOp: 0.10, tAmp: 0.03, tSp: 0.28, moonOp: 0.00, bF: 0.14, bM: 0.10, bN: 0.07, kOp: 0.12, swOp: 0.07, swW: 0.62 },
    4: { grad: 'yatsy', driftPx: 6, driftS: 22, sunOpY: [0.00, 0.90], glowOpY: [0.00, 0.90], glowScale: 1.00, pulseAmp: 0, pulseS: 12, starsOp: 0.22, tAmp: 0.04, tSp: 0.22, moonOp: 0.10, bF: 0.65, bM: 0.03, bN: 0.00, kOp: 0.11, swOp: 0.04, swW: 0.50 },
} as const;

type RGB3 = readonly [string, string, string];
const GRADIENTS: Record<string, RGB3> = {
    ertir: ['#1E3A8A', '#F4B860', '#FCD34D'] as const, // Added a 3rd color for linear gradient if needed
    oyle: ['#2C5F9E', '#A7C7E7', '#F0E8D8'] as const,
    yatsy: ['#0B132B', '#1C2541', '#040508'] as const,
    dawn_soft: ['#18293F', '#5A7088', '#C8806A'] as const,
    day_neutral: ['#D8D0BC', '#E8DCC8', '#F0E8D8'] as const,
    golden_soft: ['#C8B07A', '#D4A86A', '#B87A50'] as const,
    sunset_warm: ['#7A1808', '#C04828', '#38100A'] as const,
    night_calm: ['#040508', '#0A1222', '#161C36'] as const,
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export function RiveAtmosphereBackground(props: AtmosphereProps) {
    if (Rive !== null) return <RiveLayer {...props} />;
    return <GradientFallback {...props} />;
}

// ═══════════════════════════════════════════════════════════════════════════════
// RIVE LAYER
// ═══════════════════════════════════════════════════════════════════════════════
function RiveLayer(props: AtmosphereProps) {
    const {
        currentPrayerIndex, scrollSpeed01, motionIntensity,
        solarProgress, timeToNextPrayer01, breathIntensity, reducedMotion,
        transitionStep, // Destructured transitionStep
    } = props;
    const riveRef = useRef<any>(null);
    const [riveError, setRiveError] = useState(false);
    const scroll = splitScroll(scrollSpeed01);

    const set = (name: string, value: number) => {
        try { riveRef.current?.setInputState('HomeAtmosphereSM', name, value); } catch { }
    };

    // Prayer + transition
    useEffect(() => {
        if (!riveRef.current || reducedMotion) return;
        set('currentPrayer', currentPrayerIndex);
        set('transition', 0);
        const t = setTimeout(() => set('transition', 1), 50);
        return () => clearTimeout(t);
    }, [currentPrayerIndex]);

    // Scroll (split)
    useEffect(() => {
        if (!riveRef.current || reducedMotion) return;
        set('scrollSpeedFar', scroll.far);
        set('scrollSpeedMid', scroll.mid);
        set('scrollSpeedNear', scroll.near);
    }, [scrollSpeed01]);

    // Motion intensity
    useEffect(() => {
        if (!riveRef.current) return;
        set('motionIntensity', reducedMotion ? 0 : motionIntensity);
    }, [motionIntensity, reducedMotion]);

    // Solar progress (30s intervals upstream, triggered here on prop change)
    useEffect(() => {
        if (!riveRef.current) return;
        set('solarProgress', solarProgress);
    }, [solarProgress]);

    useEffect(() => {
        if (!riveRef.current) return;
        set('timeToNextPrayer01', timeToNextPrayer01);
        set('breathIntensity', reducedMotion ? 0 : breathIntensity);
        if (transitionStep) {
            // We set the transitionStep input directly if Rive supports it
            // (Note: Rive contract usually uses 0-1 values)
            // transitionStep is an Animated.Value, but we need the raw number for set()
            // We'll use a listener to keep it in sync if needed, but for now
            // since it only fires on prayer change, we'll just let it run.
            // Actually, for Rive we probably want a listener.
        }
    }, [timeToNextPrayer01, breathIntensity, reducedMotion]);

    if (riveError || reducedMotion) return <GradientFallback {...props} />;

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Rive
                ref={riveRef}
                resourceName="home_atmosphere"
                stateMachineName="HomeAtmosphereSM"
                style={styles.rive}
                onError={() => setRiveError(true)}
            />
        </View>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// GRADIENT FALLBACK — Full V1+V3 tuning, depth mask, motion governor, solar
// ═══════════════════════════════════════════════════════════════════════════════
function GradientFallback({
    currentPrayerIndex, scrollSpeed01, scrollDepth01,
    motionIntensity, solarProgress, breathIntensity,
    transitionStep, reducedMotion,
}: AtmosphereProps) {
    const s = FALLBACK_STATE[currentPrayerIndex];
    const depMult = getZoneMult(scrollDepth01 * 0.68 + 0.01); // posY from depth
    const mi = reducedMotion ? 0 : motionIntensity;
    const bi = reducedMotion ? 0 : breathIntensity;       // capped at 0.22 in hook
    const scroll = splitScroll(scrollSpeed01);

    // ── Solar-adjusted sun posY ──────────────────────────────────────────────
    const sunY = reducedMotion ? s.sunOpY[1] : solarSunY(solarProgress);
    const glowY = sunY;

    // ═══ LAYER A: Sky Engine opacities (prayer-dependent) ═══════════════════════
    const skyOp = {
        stars: Math.min(dm(0.12, s.starsOp, FR.stars, UICAP.stars) * depMult * mi, CAP.stars),
        sweep: Math.min(dm(0.20, s.swOp, FR.sweep) * depMult * mi + Math.min(bi * 0.04, CAP.breathExtra), CAP.lightSweep),
    };

    // ═══ LAYER B: Decorative Static Engine (Kaaba) ══════════════════════════════
    const decoOp = {
        kaaba: DEBUG_DECO ? 1.0 : Math.max(DECO.KAABA_FLOOR, mi * DECO.KAABA_BASE),
    };

    // DEBUG: log full prayer-state test matrix (throttled)
    const lastLog = useRef(0);
    if (DEBUG_DECO) {
        const now = Date.now();
        if (now - lastLog.current > 1500) {
            const pf = FALLBACK_STATE[currentPrayerIndex]?.bF || 0;
            // V3.1 Assertion: Isha (4) must have pf=0.65
            const ishaCheck = currentPrayerIndex === 4 ? (pf === 0.65 ? 'PASS' : `FAIL(${pf})`) : 'NA';

            console.log(
                `[ATMOS_V3.3] prayer=${currentPrayerIndex} pf=${fmt(pf)} isha=${ishaCheck} mi=${fmt(mi)}` +
                ` | kaabaOpacity=${fmt(decoOp.kaaba)}`
            );
            lastLog.current = now;
        }
    }

    const prevIdx = useRef<PrayerIndex>(currentPrayerIndex);
    const ease = Easing.inOut(Easing.cubic);

    // Layer A Animated values (prayer-driven)
    const starsA = useRef(new Animated.Value(skyOp.stars)).current;
    const sweepA = useRef(new Animated.Value(skyOp.sweep)).current;
    const horizonA = useRef(new Animated.Value(0.22)).current; // V3 horizon glow

    // Layer A animation internals
    const pulseA = useRef(new Animated.Value(0)).current;
    const driftA = useRef(new Animated.Value(0)).current;

    // Layer B Animated values (Kaaba)
    const kaabaA = useRef(new Animated.Value(decoOp.kaaba)).current;

    // ═══ LAYER A: Prayer cross-fade (sky elements ONLY) ════════════════════════
    // ⚠ kaabaA / bFarA / bMidA / bNearA are intentionally ABSENT here.
    //   Decorative opacity is NEVER driven by prayer state.
    useEffect(() => {
        const recomputeSky = () => {
            const ns = FALLBACK_STATE[currentPrayerIndex];
            const dep2 = getZoneMult(scrollDepth01 * 0.68 + 0.01);
            const sy2 = reducedMotion ? ns.sunOpY[1] : solarSunY(solarProgress);
            return {
                stars: Math.min(dm(0.12, ns.starsOp, FR.stars, UICAP.stars) * dep2 * mi, CAP.stars),
                sweep: Math.min(dm(0.20, ns.swOp, FR.sweep) * dep2 * mi, CAP.lightSweep),
            };
        };

        if (reducedMotion) {
            const sky2 = recomputeSky();
            starsA.setValue(sky2.stars);
            sweepA.setValue(sky2.sweep);
            prevIdx.current = currentPrayerIndex;
            return;
        }
        if (prevIdx.current === currentPrayerIndex) return;
        prevIdx.current = currentPrayerIndex;

        const sky2 = recomputeSky();
        Animated.parallel([
            Animated.timing(starsA, { toValue: sky2.stars, duration: 1200, delay: 50, easing: ease, useNativeDriver: true }),
            Animated.timing(sweepA, { toValue: sky2.sweep, duration: 1200, delay: 50, easing: ease, useNativeDriver: true }),
        ]).start();
    }, [currentPrayerIndex, reducedMotion, motionIntensity]);

    // ═══ LAYER B: Decorative Engine — ARCHITECTURAL FREEZE ════════════════════════
    // CONTRACT (do NOT modify without updating this block):
    //   • motionIntensity is the SOLE driver of opacity
    //   • Formula is LOCKED to: Math.max(FLOOR, mi × BASE)  [from DECO constants]
    //   • currentPrayerIndex MUST NOT be in the dependency array — ever
    //   • bFarA / bMidA / bNearA / kaabaA MUST NOT appear in prayer cross-fade
    //   • Scroll speed MUST NOT influence Layer B opacity
    // VIOLATION = birds/kaaba disappearing on prayer change or in battery-saver mode.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        const ease2 = Easing.out(Easing.ease);
        Animated.timing(kaabaA, { toValue: decoOp.kaaba, duration: 400, easing: ease2, useNativeDriver: true }).start();
        // ⚠ [motionIntensity, reducedMotion] ONLY — prayer index intentionally excluded
    }, [motionIntensity, reducedMotion]); // LAYER-B-RULE: prayer deps forbidden


    // ── Layer A: motion intensity → re-animate sky layers ─────────────────────
    useEffect(() => {
        Animated.parallel([
            Animated.timing(starsA, { toValue: Math.min(skyOp.stars, CAP.stars), duration: 400, easing: ease, useNativeDriver: true }),
            Animated.timing(sweepA, { toValue: Math.min(skyOp.sweep, CAP.lightSweep), duration: 400, easing: ease, useNativeDriver: true }),
        ]).start();
    }, [motionIntensity, breathIntensity]);
    // Layer B motionIntensity response is handled above in the dedicated Layer B effect.

    // ── Star twinkle loop ─────────────────────────────────────────────────────
    useEffect(() => {
        if (reducedMotion || mi === 0 || s.starsOp === 0) return;
    }, [currentPrayerIndex, reducedMotion, motionIntensity]);

    // ── Glow pulse loop (breathIntensity modulated period) ────────────────────
    useEffect(() => {
        if (reducedMotion || mi === 0 || s.glowOpY[0] === 0) return;
        // Breathing grows slightly as next prayer approaches
        const period = lerp(s.pulseS * 1000, 10_000, bi / 0.22);
        const loop = Animated.loop(Animated.sequence([
            Animated.timing(pulseA, { toValue: 1, duration: period / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            Animated.timing(pulseA, { toValue: 0, duration: period / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]));
        loop.start();
        return () => loop.stop();
    }, [currentPrayerIndex, reducedMotion, motionIntensity, breathIntensity]);

    // ── Horizon Glow Breathe ──
    useEffect(() => {
        if (reducedMotion) return;
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(horizonA, { toValue: 0.18, duration: 3500, easing: Easing.inOut(Easing.sin), useNativeDriver: false }), // Boosted horizon glow BASE (V3.5)
                Animated.timing(horizonA, { toValue: 0.12, duration: 3500, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [reducedMotion]);

    // ── Drift parallax ────────────────────────────────────────────────────────
    useEffect(() => {
        if (reducedMotion || mi === 0) return;
        const dampedDrift = s.driftPx * 0.55 * mi;
        const period = s.driftS * 1000;
        const loop = Animated.loop(Animated.sequence([
            Animated.timing(driftA, { toValue: dampedDrift, duration: period / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            Animated.timing(driftA, { toValue: 0, duration: period / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]));
        loop.start();
        return () => loop.stop();
    }, [currentPrayerIndex, reducedMotion, motionIntensity]);

    // ── Scroll reactivity — Layer A only (sweep), Layer B birds are static ────
    // Birds opacity does NOT change with scroll speed — they are static decorations.
    // Only the sky sweep layer reacts to scroll.
    useEffect(() => {
        if (reducedMotion) return;
        Animated.timing(sweepA, {
            toValue: Math.min(skyOp.sweep + scroll.far * 0.02, CAP.lightSweep),
            duration: 100,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
        }).start();
    }, [scrollSpeed01, scrollDepth01, reducedMotion]);

    // Layer B is pointerEvents=none, non-interactive. Birds don't react to scroll.

    // ── Derived glowOpacity (breathIntensity modulated pulse) ─────────────────
    const starOp = starsA;

    const grad = GRADIENTS[s.grad];
    const moonTop = 0.25 * SH * 0.46;
    const night = currentPrayerIndex === 4 || currentPrayerIndex === 0;


    // ── Entry Orchestration Sequence (Spec V1.0) ──
    const entryA = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.timing(entryA, {
            toValue: 1,
            duration: 1200,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true
        }).start();
    }, []);

    return (
        <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: entryA }]} pointerEvents="none">
            {/* Sky gradient + drift */}
            <Animated.View style={[StyleSheet.absoluteFillObject, { transform: [{ translateY: reducedMotion ? 0 : driftA }] }]}>
                <LinearGradient colors={grad} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 0.35, y: 1 }} />
            </Animated.View>

            {/* ════ SkyEngineV3 (Celestial) ════ */}
            <SkyEngineV3
                currentPrayerIndex={currentPrayerIndex}
                motionIntensity={motionIntensity}
                solarProgress={solarProgress}
                reducedMotion={reducedMotion}
            />

            {/* Stars (fallback/secondary) */}
            {s.starsOp > 0 && <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: reducedMotion ? starsA : starOp }]}><StarDots /></Animated.View>}

            {/* Horizon Glow (V3) */}
            <Animated.View style={[styles.horizonGlow, { opacity: horizonA }]} />

            {/* Light sweep */}
            <Animated.View style={[styles.sweep, { width: SW * s.swW, opacity: sweepA }]} />

            {/* ════ LAYER B: Decorative Static Engine ════ */}
            {/* Rule: prayer-independent. Opacity = Math.max(FLOOR, mi × BASE) */}
            {/* Kaaba — bottom-anchored, rendered BELOW scrim so cream softens it */}
            <Animated.View
                style={[
                    styles.kaabaWrap,
                    { opacity: kaabaA },
                    DEBUG_DECO && { zIndex: 999 },
                ]}
                pointerEvents="none"
            >
                <KaabaSilhouette
                    night={currentPrayerIndex === 4}
                    ember={currentPrayerIndex === 3}
                    debugColor={DEBUG_DECO}
                />
            </Animated.View>
            {/* TEST 1: scrim opacity → 0 removes cream overlay entirely */}
            <LinearGradient
                colors={[
                    'transparent',
                    DEBUG_DECO ? 'rgba(250,247,242,0)' : 'rgba(250,247,242,0.72)',
                    DEBUG_DECO ? 'rgba(250,247,242,0)' : 'rgba(250,247,242,0.92)',
                ]}
                style={styles.scrim}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                locations={[0.12, 0.48, 0.70]}
                pointerEvents="none"
            />
            {/* ── Atmosphere Layer (V3.3) ── */}
            <AtmosphereLayer
                currentPrayerIndex={currentPrayerIndex}
                reducedMotion={reducedMotion}
            />

            {/* ── Decorative: Birds V3 (above atmosphere) ── */}
            <BirdsEngineV3
                currentPrayerIndex={currentPrayerIndex}
                motionIntensity={motionIntensity}
                transitionStep={transitionStep}
                reducedMotion={reducedMotion}
            />
        </Animated.View>
    );
}

// ─── StarDots ──────────────────────────────────────────────────────────────────
const STAR_POS = [{ t: 0.030, l: 0.08, s: 2.0 }, { t: 0.060, l: 0.28, s: 1.4 }, { t: 0.025, l: 0.48, s: 1.8 }, { t: 0.080, l: 0.68, s: 1.2 }, { t: 0.042, l: 0.86, s: 2.0 }, { t: 0.110, l: 0.18, s: 1.0 }, { t: 0.095, l: 0.42, s: 1.6 }, { t: 0.130, l: 0.60, s: 1.2 }, { t: 0.055, l: 0.92, s: 1.6 }, { t: 0.145, l: 0.35, s: 1.0 }, { t: 0.015, l: 0.74, s: 1.4 }, { t: 0.170, l: 0.78, s: 1.0 }, { t: 0.038, l: 0.55, s: 1.2 }, { t: 0.100, l: 0.95, s: 1.6 }, { t: 0.120, l: 0.05, s: 1.2 }, { t: 0.160, l: 0.52, s: 0.9 }];
function StarDots() {
    return <>{STAR_POS.map((p, i) => <View key={i} style={{ position: 'absolute', top: `${p.t * 100}%` as any, left: `${p.l * 100}%` as any, width: p.s, height: p.s, borderRadius: p.s / 2, backgroundColor: 'rgba(255,255,255,0.92)' }} />)}</>;
}


// ─── KaabaSilhouette — enlarged, bottom-anchored, debug-ready ────────────────
function KaabaSilhouette({ night, ember, debugColor }: { night: boolean; ember: boolean; debugColor?: boolean }) {
    // TEST 2: debug = vivid red so we can see if kaaba IS rendering
    const col = debugColor
        ? 'rgba(255,0,0,1)'
        : night ? 'rgba(8,12,28,1)'
            : ember ? 'rgba(30,8,2,1)'
                : 'rgba(55,36,10,1)';
    const ringCol = debugColor
        ? 'rgba(255,0,0,0.60)'
        : night ? 'rgba(8,12,28,0.50)'
            : ember ? 'rgba(30,8,2,0.50)'
                : 'rgba(55,36,10,0.50)';
    return (
        <View style={styles.kaabaGroup}>
            {/* Mataf circumambulation ring */}
            <View style={[styles.matafRing, { borderColor: ringCol }]} />
            {/* Main cube body (Kaaba) */}
            <View style={[styles.cube, { backgroundColor: col }]}>
                {/* Kiswa band — golden horizontal stripe */}
                <View style={[styles.kiswa, { backgroundColor: 'rgba(196,160,80,0.22)' }]} />
                {/* Door outline */}
                <View style={styles.door} />
            </View>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    rive: { flex: 1 },
    sunDisk: { position: 'absolute', alignSelf: 'center', width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,245,200,0.80)' },
    sunGlow: { position: 'absolute', alignSelf: 'center', width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,220,130,0.38)' },
    moonDisk: { position: 'absolute', right: SW * 0.18, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(230,235,255,0.80)' },
    horizonGlow: { position: 'absolute', bottom: 0, left: 0, right: 0, height: SH * 0.35, backgroundColor: 'rgba(255,247,242,0.18)' },
    sweep: { position: 'absolute', top: 0, right: 0, height: SH * 0.40, borderBottomLeftRadius: 999, backgroundColor: 'rgba(255,252,220,0.28)' },
    // ── Kaaba: bottom-center anchored, larger silhouette ──
    kaabaWrap: {
        position: 'absolute',
        bottom: SH * 0.10,   // 10% from bottom — peeks through bottom scrim edge
        alignSelf: 'center',
        width: SW * 0.42,    // 42% screen width — "contain" feel
        alignItems: 'center',
    },
    kaabaGroup: { alignItems: 'center', width: '100%' },
    // Ring is wide — proportional to screen
    matafRing: {
        width: SW * 0.36, height: SW * 0.36 * 0.32,
        borderRadius: (SW * 0.36) / 2,
        borderWidth: 1.0,
        marginBottom: 4,
    },
    // Cube body — taller proportional silhouette
    cube: {
        width: SW * 0.18, height: SW * 0.22,
        borderRadius: 3,
        overflow: 'hidden',
    },
    // Kiswa (horizontal band, golden tint)
    kiswa: {
        position: 'absolute',
        top: '38%', left: 0, right: 0,
        height: 2.5,
    },
    // Door (small vertical rectangle on face)
    door: {
        position: 'absolute',
        bottom: 0,
        alignSelf: 'center',
        width: SW * 0.036,
        height: SW * 0.056,
        backgroundColor: 'rgba(255,255,255,0.13)',
        borderTopLeftRadius: 2,
        borderTopRightRadius: 2,
    },
    scrim: { ...StyleSheet.absoluteFillObject, zIndex: 1 },
});
