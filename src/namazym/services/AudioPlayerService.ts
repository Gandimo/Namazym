import { Audio } from 'expo-av';

/**
 * AudioPlayerService
 * Handles foreground playback of the full Azan sound.
 */
class AudioPlayerService {
    private sound: Audio.Sound | null = null;
    private isPlayingAudio: boolean = false;

    async playFullAzan() {
        try {
            // Stop any existing playback
            await this.stop();

            const { sound } = await Audio.Sound.createAsync(
                require('../assets/audio/azan_full.mp3'),
                { shouldPlay: true, isLooping: false }
            );

            this.sound = sound;
            this.isPlayingAudio = true;

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
