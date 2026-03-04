/**
 * useScrollDynamics — jitter-free scroll physics for atmosphere reactivity.
 *
 * Derives two normalized outputs from raw ScrollView events:
 *   scrollSpeed01  – how fast the user is scrolling (0=still, 1=fast)
 *   scrollDepth01  – how far down the page the viewport is (0=top, 1=bottom)
 *
 * Speed uses exponential smoothing (alpha=0.08) to prevent velocity spikes
 * from creating jarring flashes in background animation layers.
 * Output is capped at 0.85 for real-device stability.
 */

import { useRef, useState } from 'react';

// ─── Utilities ────────────────────────────────────────────────────────────────
function clamp(v: number, min: number, max: number) {
    return Math.min(Math.max(v, min), max);
}
function lerp(start: number, end: number, alpha: number) {
    return start + (end - start) * alpha;
}
function map(value: number, inMin: number, inMax: number, outMin: number, outMax: number) {
    return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useScrollDynamics() {
    const prevOffset = useRef(0);
    const prevTime = useRef(Date.now());
    const smoothed = useRef(0);

    const [scrollSpeed01, setScrollSpeed01] = useState(0);
    const [scrollDepth01, setScrollDepth01] = useState(0);

    function onScroll(
        offsetY: number,
        viewportHeight: number,
        contentHeight: number,
    ) {
        const now = Date.now();

        // ── Velocity ──────────────────────────────────────────────────────────
        const dy = Math.abs(offsetY - prevOffset.current);
        const dt = Math.max(1, now - prevTime.current);
        const velocity = dy / dt;                            // px/ms

        // Map 0..1.2 px/ms → 0..1, then smooth with alpha=0.08
        const normalized = clamp(map(velocity, 0, 1.2, 0, 1), 0, 1);
        smoothed.current = lerp(smoothed.current, normalized, 0.08);

        // Hard cap at 0.85 for real-device stability
        const cappedSpeed = Math.min(smoothed.current, 0.85);
        setScrollSpeed01(cappedSpeed);

        // ── Depth ─────────────────────────────────────────────────────────────
        const depth = clamp(
            offsetY / Math.max(1, contentHeight - viewportHeight),
            0, 1,
        );
        setScrollDepth01(depth);

        prevOffset.current = offsetY;
        prevTime.current = now;
    }

    return { scrollSpeed01, scrollDepth01, onScroll };
}
