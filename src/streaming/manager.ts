import { StreamManager, AudioConfig, TranscriptionMessage } from "../types";
import { streamSTT } from "../services/stt";

class AudioStreamManager implements StreamManager {
    private isActive: boolean = false;
    private currentConfig: AudioConfig | null = null;
    private sttHandler: STTHandler | null = null;
    private transcriptions: string[] = [];

    private static instance: AudioStreamManager | null = null;

    public static getInstance(): AudioStreamManager {
        if (!AudioStreamManager.instance) {
            AudioStreamManager.instance = new AudioStreamManager();
        }
        return AudioStreamManager.instance;
    }

    private constructor() {}

    async startStream(config: AudioConfig): Promise<void> {
        if (this.isActive) throw new Error("Stream already active.");
        this.isActive = true;
        this.currentConfig = config;
        
        // Initialize STT handler when stream starts
        this.sttHandler = await streamSTT(
            (transcription) => {
                // Handle transcription callback
                console.log("Transcription received:", transcription);
                this.handleTranscription(transcription);
            },
            config.sampleRate
        );
        
        console.log("Stream started with config:", config);
    }

    private handleTranscription(text: string): void {
        this.transcriptions.push(text);
        const message: TranscriptionMessage = {
            type: 'transcription',
            transcription: text
        };
        // Emit or handle the transcription message
        console.log("Transcription message:", message);
    }

    async processAudioChunk(chunk: Buffer): Promise<void> {
        if (!this.isActive) throw new Error("Stream is not active.");
        if (!this.sttHandler) throw new Error("STT handler not initialized.");
        
        console.log(`Processing audio chunk of size: ${chunk.length}`);
        await this.sttHandler.sendAudioChunk(chunk);
    }

    async stopStream(): Promise<string[]> {
        if (!this.isActive) throw new Error("No active stream to stop.");
        if (this.sttHandler) {
            await this.sttHandler.close();
            this.sttHandler = null;
        }
        this.isActive = false;
        this.currentConfig = null;
        const finalTranscriptions = this.transcriptions;
        this.transcriptions = []; // Clear for next session
        console.log("Stream stopped.");
        return finalTranscriptions;
    }

    async pauseStream(): Promise<void> {
        if (!this.isActive) throw new Error("No active stream to pause.");
        this.isActive = false;
        console.log("Stream paused.");
    }

    async resumeStream(): Promise<void> {
        if (this.isActive) return; // Already active
        if (!this.currentConfig) throw new Error("No stream configuration available");
        this.isActive = true;
        console.log("Stream resumed.");
    }

    isStreamActive(): boolean {
        return this.isActive;
    }

    public getAllTranscriptions(): string[] {
        return this.transcriptions;
    }
}

export default AudioStreamManager;

// Type for STT handler
interface STTHandler {
    sendAudioChunk: (chunk: Buffer) => Promise<void>;
    close: () => Promise<void>;
}
