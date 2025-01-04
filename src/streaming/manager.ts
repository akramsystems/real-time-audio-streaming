import { StreamManager, AudioConfig } from "../types";
import { streamSTT } from "../services/stt";

class AudioStreamManager implements StreamManager {
  private static instance: AudioStreamManager | null = null;
  private isActive = false;
  private currentConfig: AudioConfig | null = null;
  private sttHandler: STTHandler | null = null;
  private transcriptions: string[] = [];

  public static getInstance(): AudioStreamManager {
    if (!AudioStreamManager.instance) {
      AudioStreamManager.instance = new AudioStreamManager();
    }
    return AudioStreamManager.instance;
  }

  private constructor() {}

  async processAudioChunk(chunk: Buffer): Promise<void> {
    if (!this.isActive || !this.sttHandler) {
      throw new Error("Stream is not active or STT handler is missing.");
    }
    await this.sttHandler.sendAudioChunk(chunk);
  }

  async startStream(config: AudioConfig): Promise<void> {
    if (this.isActive) throw new Error("Stream already active.");
    this.isActive = true;
    this.currentConfig = config;
    this.sttHandler = await streamSTT(
      (transcription) => {
        this.transcriptions.push(transcription);
      },
      config.sampleRate
    );
    console.log("Stream started with config:", config);
  }

  async stopStream(): Promise<string[]> {
    if (!this.isActive) throw new Error("No active stream to stop.");
    if (this.sttHandler) {
      await this.sttHandler.close();
      this.sttHandler = null;
    }
    this.isActive = false;
    this.currentConfig = null;
    const finalTranscriptions = [...this.transcriptions];
    this.transcriptions = [];
    console.log("Stream stopped.");
    return finalTranscriptions;
  }

  async pauseStream(): Promise<void> {
    if (!this.isActive) throw new Error("No active stream to pause.");
    this.isActive = false;
    console.log("Stream paused.");
  }

  async resumeStream(): Promise<void> {
    if (this.isActive) return;
    if (!this.currentConfig) throw new Error("No stream configuration available.");
    this.isActive = true;
    console.log("Stream resumed.");
  }

  isStreamActive(): boolean {
    return this.isActive;
  }
}

export default AudioStreamManager;

interface STTHandler {
  sendAudioChunk: (chunk: Buffer) => Promise<void>;
  close: () => Promise<void>;
}

