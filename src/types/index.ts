export interface AudioConfig {
    sampleRate: number;
    channels: number;
    encoding: AudioEncoding;
}

export enum AudioEncoding {
    AAC = 'AAC',
    WAV = 'WAV',
    MP3 = 'MP3'
}


export interface StreamHandler {
    handleAudioChunk(chunk: Buffer): Promise<void>;
    handleTranscription(text: string): Promise<void>;
}

export interface StreamManager {
    startStream(config: AudioConfig): Promise<void>;
    stopStream(): Promise<void>;
    pauseStream(): Promise<void>;
    resumeStream(): Promise<void>;
}

export * from './messages';

