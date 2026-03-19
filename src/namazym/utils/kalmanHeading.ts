/**
 * kalmanHeading.ts
 * 
 * 1D Kalman Filter tailored for circular compass headings (0-360°).
 * Reduces magnetic sensor noise before smoothing/animation.
 */

import { angularDifference } from './kyblaUtils';

export class KalmanHeadingFilter {
    private estimate: number | null = null;
    private errorEstimate: number;
    private processNoise: number;
    private measurementNoise: number;

    /**
     * @param processNoise - Defines how fast the filter adapts to real movement. 
     *                       Lower = smoother but laggier. (0.008 to 0.05)
     * @param measurementNoise - Expected variance in sensor reading.
     *                           Higher = trusts sensor less, smooths more. (2.0 to 5.0)
     */
    constructor(processNoise = 0.015, measurementNoise = 3.0) {
        this.errorEstimate = 1.0;
        this.processNoise = processNoise;
        this.measurementNoise = measurementNoise;
    }

    /**
     * Updates the filter with a new raw measurement (0-360) and returns the filtered angle.
     */
    update(measurement: number): number {
        if (this.estimate === null) {
            this.estimate = measurement;
            return this.estimate;
        }

        // Prediction Update
        this.errorEstimate += this.processNoise;

        // Measurement Update (Kalman Gain)
        const kalmanGain = this.errorEstimate / (this.errorEstimate + this.measurementNoise);

        // Handle circular wrap-around (e.g., passing 359° to 1°)
        // Calculate the shortest angular path from the current estimate to the new measurement
        const delta = angularDifference(this.estimate, measurement);

        // Update estimate
        this.estimate += kalmanGain * delta;

        // Normalize back to 0-360°
        this.estimate = (this.estimate % 360 + 360) % 360;

        // Update error estimate
        this.errorEstimate = (1 - kalmanGain) * this.errorEstimate;

        return this.estimate;
    }

    /**
     * Reset filter state (useful if returning from background, etc.)
     */
    reset() {
        this.estimate = null;
        this.errorEstimate = 1.0;
    }
}
