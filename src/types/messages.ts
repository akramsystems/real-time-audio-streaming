import { AudioConfig } from ".";
// WebSocket Message Types
export type WebSocketMessage = ConfigMessage | TranscriptionMessage | ErrorMessage | StatusMessage;

export interface ConfigMessage {
    type: 'config';
    audio: AudioConfig;
}

export interface TranscriptionMessage {
    type: 'transcription';
    transcription: string;
}

export interface ErrorMessage {
    type: 'error';
    error: string;
}

export interface StatusMessage {
    type: 'status';
    status: 'ready' | 'processing' | 'stopped';
}

// Server Configuration Types
export interface ServerConfig {
    port: number;
    websocketPath: string;
}

// Audio Processing Types
export interface AudioStreamConfig {
    chunkSize: number;
    streamIntervalMs: number;
    audioFilePath: string;
}
