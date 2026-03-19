/**
 * headingFusion.ts
 *
 * Lightweight Gyroscope + Magnetometer sensor fusion.
 * Combines highly responsive short-term gyroscope rotation with 
 * absolute, long-term magnetometer heading correction.
 */

import { angularDifference } from './kyblaUtils';

export class HeadingFusion {
    private fusedHeading: number | null = null;
    private correctionGain: number;

    /**
     * @param correctionGain - How fast the fused heading is pulled toward the absolute magnetometer heading.
     *                         (0.02 - 0.08) is a good range. Lower = smoother but relies more on gyro accuracy. 
     */
    constructor(correctionGain = 0.05) {
        this.correctionGain = correctionGain;
    }

    /**
     * @param magHeading - The absolute, (optionally Kalman-filtered) magnetometer heading (0-360)
     * @param gyroRateDegs - Angular velocity around the Earth's vertical axis (deg/s).
     *                       Positive means counter-clockwise rotation, which causes heading to decrease.
     * @param dt - Delta time in seconds since the last update.
     * @param hasGyro - Fallback flag. If false, acts as a pass-through to prevent lag.
     */
    update(magHeading: number, gyroRateDegs: number, dt: number, hasGyro: boolean): number {
        if (this.fusedHeading === null) {
            this.fusedHeading = magHeading;
            return this.fusedHeading;
        }

        // Graceful fallback: if gyroscope data isn't streaming, trust magnetometer completely
        // to avoid heavy low-pass drag when rotating.
        if (!hasGyro || dt <= 0 || dt > 1.0) {
            this.fusedHeading = magHeading;
            return this.fusedHeading;
        }

        // 1. Predict: Gyroscope short-term rotation
        // Standard right-hand orientation: CCW physical rotation = Heading value decreases.
        let predicted = this.fusedHeading - (gyroRateDegs * dt);

        // 2. Correct: Pull gently toward absolute magnetometer heading to correct gyro drift
        const diff = angularDifference(predicted, magHeading);
        this.fusedHeading = predicted + (diff * this.correctionGain);

        // 3. Normalize to 0-360
        this.fusedHeading = (this.fusedHeading % 360 + 360) % 360;

        return this.fusedHeading;
    }

    reset() {
        this.fusedHeading = null;
    }
}
