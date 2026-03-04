import { Audio } from 'expo-av';

const AMBIENT_SOURCE = require('../../../assets/sounds/reminder_soft.wav'); // Placeholder for Ambient Sound

/**
 * NAMAZYM Sound Service
 * Manages ambient audio playback with fade effects
 */
export class SoundService {
    private static sound: Audio.Sound | null = null;
    private static isPlaying = false;

    /**
     * Start playing ambient sound (looped)
     */
    static async playAmbience() {
        if (this.isPlaying) return;

        try {
            // Load if not loaded
            if (!this.sound) {
                const { sound } = await Audio.Sound.createAsync(
                    AMBIENT_SOURCE,
                    { isLooping: true, volume: 0 } // Start silent
                );
                this.sound = sound;
            }

            await this.sound.playAsync();
            this.isPlaying = true;

            // Fade in
            await this.fadeVolume(0, 0.3, 1000); // Max volume 0.3 (subtle)
        } catch (error) {
            console.log('Error playing ambient sound:', error);
        }
    }

    /**
     * Stop playing ambient sound
     */
    static async stopAmbience() {
        if (!this.sound || !this.isPlaying) return;

        try {
            // Fade out
            await this.fadeVolume(0.3, 0, 800);
            await this.sound.stopAsync();
            this.isPlaying = false;
        } catch (error) {
            console.log('Error stopping ambient sound:', error);
        }
    }

    /**
     * Helper to fade volume
     */
    private static async fadeVolume(from: number, to: number, duration: number) {
        if (!this.sound) return;

        const steps = 10;
        const stepTime = duration / steps;
        const volStep = (to - from) / steps;

        for (let i = 1; i <= steps; i++) {
            const vol = from + (volStep * i);
            await this.sound.setVolumeAsync(vol);
            await new Promise(resolve => setTimeout(resolve, stepTime));
        }
    }

    static async unload() {
        if (this.sound) {
            await this.sound.unloadAsync();
            this.sound = null;
            this.isPlaying = false;
        }
    }
}
