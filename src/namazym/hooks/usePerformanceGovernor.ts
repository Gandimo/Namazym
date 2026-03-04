/**
 * usePerformanceGovernor — RAF-based FPS sampling for atmosphere quality control.
 *
 * Measures real rendered FPS over 500ms windows and classifies device into three tiers:
 *   HIGH   ≥50 fps  → full atmosphere, all layers
 *   MEDIUM ≥38 fps  → birdsNear off, glow/sweep reduced
 *   LOW    <38 fps  → all birds off, minimal glow/stars
 *
 * Hysteresis (anti-flicker):
 *   A tier change requires 3 consecutive confirming samples before it commits.
 *   This prevents rapid oscillation on borderline devices.
 *
 * Tier index for Rive input:
 *   HIGH=0  MEDIUM=1  LOW=2
 */

import { useEffect, useRef, useState } from 'react';

export type PerformanceTier = 'HIGH' | 'MEDIUM' | 'LOW';

// ─── Tier thresholds ──────────────────────────────────────────────────────────
function classifyFps(fps: number): PerformanceTier {
    if (fps >= 50) return 'HIGH';
    if (fps >= 38) return 'MEDIUM';
    return 'LOW';
}

// ─── Tier → Rive index ────────────────────────────────────────────────────────
export function tierIndex(tier: PerformanceTier): number {
    return tier === 'HIGH' ? 0 : tier === 'MEDIUM' ? 1 : 2;
}

// ─── Per-tier gradient fallback multipliers ───────────────────────────────────
/**
 * Returns per-layer opacity multipliers for the gradient fallback renderer.
 * HIGH   = 1.0 across all layers
 * MEDIUM = birdsNear→0, birdsMid→0.85, glow→0.80, sweep→0.70, drift→0.82
 * LOW    = all birds→0, glow→0.55, stars→0.65, sweep→0.35, drift→0.60
 */
export interface TierMultipliers {
    birdsNear: number;
    birdsMid: number;
    birdsFar: number;
    glow: number;
    stars: number;
    lightSweep: number;
    drift: number;
}

const TIER_MULTS: Record<PerformanceTier, TierMultipliers> = {
    HIGH: {
        birdsNear: 1.00, birdsMid: 1.00, birdsFar: 1.00,
        glow: 1.00, stars: 1.00, lightSweep: 1.00, drift: 1.00,
    },
    MEDIUM: {
        birdsNear: 0.00, birdsMid: 0.85, birdsFar: 1.00,
        glow: 0.80, stars: 1.00, lightSweep: 0.70, drift: 0.82,
    },
    LOW: {
        birdsNear: 0.00, birdsMid: 0.00, birdsFar: 0.00,
        glow: 0.55, stars: 0.65, lightSweep: 0.35, drift: 0.60,
    },
};

export function getTierMultipliers(tier: PerformanceTier): TierMultipliers {
    return TIER_MULTS[tier];
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function usePerformanceGovernor() {
    const frameCount = useRef(0);
    const lastTime = useRef<number | null>(null);

    // Hysteresis: pending tier must be seen N times before committing
    const HYSTERESIS_COUNT = 3;
    const pendingTier = useRef<PerformanceTier>('HIGH');
    const pendingCount = useRef(0);

    const [fps, setFps] = useState(60);
    const [performanceTier, setPerformanceTier] = useState<PerformanceTier>('HIGH');

    useEffect(() => {
        let rafId: number;

        function loop(now: number) {
            if (lastTime.current === null) {
                lastTime.current = now;
            }
            frameCount.current++;

            const delta = now - lastTime.current;

            if (delta >= 500) {
                const currentFps = Math.round((frameCount.current * 1000) / delta);
                setFps(currentFps);

                frameCount.current = 0;
                lastTime.current = now;

                // ── Hysteresis logic ──────────────────────────────────────────
                const candidate = classifyFps(currentFps);

                if (candidate === pendingTier.current) {
                    pendingCount.current++;
                    if (pendingCount.current >= HYSTERESIS_COUNT) {
                        // Commit the tier change
                        setPerformanceTier(candidate);
                        pendingCount.current = 0;
                    }
                } else {
                    // New candidate — reset counter
                    pendingTier.current = candidate;
                    pendingCount.current = 1;
                }
            }

            rafId = requestAnimationFrame(loop);
        }

        rafId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(rafId);
    }, []);

    const fpsCap = performanceTier === 'HIGH' ? 1.00 : performanceTier === 'MEDIUM' ? 0.75 : 0.55;

    return {
        fps,
        fpsCap,
        performanceTier,
        tierIdx: tierIndex(performanceTier),
        tierMults: getTierMultipliers(performanceTier),
    };
}
