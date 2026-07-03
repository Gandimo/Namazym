import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';

/**
 * AudioPlayerService
 * Handles foreground playback of the full Azan sound.
 *
 * The bundled recording lives at `assets/audio/azan_full.mp3`. Replace that
 * file (keep the same filename) to swap the Azan voice.
 */
const AZAN_SOURCE = require('../assets/audio/azan_full.mp3');

class AudioPlayerService {
    private sound: Audio.Sound | null = null;
    private isPlayingAudio: boolean = false;
    private audioModeReady: boolean = false;

    /**
     * Configure the audio session so the Azan is audible even when the iOS
     * silent switch is on. Called lazily before the first playback.
     */
    private async ensureAudioMode() {
        if (this.audioModeReady) return;
        try {
            await Audio.setAudioModeAsync({
                playsInSilentModeIOS: true,
                staysActiveInBackground: false,
                // Do NOT duck our own Azan on Android — it must play at full media
                // volume. DoNotMix already pauses other audio while it plays.
                shouldDuckAndroid: false,
                interruptionModeIOS: InterruptionModeIOS.DoNotMix,
                interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
                playThroughEarpieceAndroid: false,
            });
            this.audioModeReady = true;
        } catch (error) {
            console.error('[AudioPlayerService] Failed to set audio mode:', error);
        }
    }

    async playFullAzan() {
        try {
            // Stop any existing playback
            await this.stop();
            await this.ensureAudioMode();

            const { sound } = await Audio.Sound.createAsync(
                AZAN_SOURCE,
                // volume 1.0 = maximum in-app playback level (relative to the
                // device media volume). The asset itself is loudness-normalised
                // to ~-12 LUFS / -1 dBTP so it is as loud as possible without clipping.
                { shouldPlay: true, isLooping: false, volume: 1.0 }
            );
            // Belt-and-suspenders: force max volume on the loaded sound too.
            await sound.setVolumeAsync(1.0);

            this.sound = sound;
            this.isPlayingAudio = true;

            if (__DEV__) {
                console.log('[AudioPlayerService] Playing full Azan | source=assets/audio/azan_full.mp3 | volume=1.0');
            }

            sound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded && status.didJustFinish) {
                    this.isPlayingAudio = false;
                    this.cleanup();
                }
            });

        } catch (error) {
            console.error('[AudioPlayerService] Error playing Azan:', error);
            this.isPlayingAudio = false;
        }
    }

    async stop() {
        if (this.sound) {
            try {
                await this.sound.stopAsync();
                await this.sound.unloadAsync();
            } catch (e) {
                // Ignore unload errors
            }
            this.sound = null;
        }
        this.isPlayingAudio = false;
    }

    isPlaying() {
        return this.isPlayingAudio;
    }

    private async cleanup() {
        if (this.sound) {
            try {
                await this.sound.unloadAsync();
            } catch (e) { }
            this.sound = null;
        }
    }
}

export const AudioPlayerServiceInstance = new AudioPlayerService();
export default AudioPlayerServiceInstance;
