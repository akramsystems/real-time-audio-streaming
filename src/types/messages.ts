import { AudioConfig } from ".";
// WebSocket Message Types
export type WebSocketMessage = 
    | ConfigMessage 
    | TranscriptionMessage 
    | ErrorMessage 
    | StartAudioUploadMessage
    | AudioChunkMessage 
    | EndAudioChunkMessage
    | FinalTranscriptionsMessage
    | AiResponseMessage;

export interface ConfigMessage {
    type: 'initial_config';
    audio: AudioConfig;
}

export interface TranscriptionMessage {
    type: 'transcription';
    transcription: string;
}

export interface AiResponseMessage {
    type: 'ai_response';
    response: string;
}

export interface ErrorMessage {
    type: 'error';
    error: string;
}

export interface StartAudioUploadMessage {
    type: 'start_audio_upload';
}

export interface AudioChunkMessage {
    type: 'audio_chunk_input';
    data: string; // base64 encoded audio data
}

export interface EndAudioChunkMessage {
    type: 'end_audio_chunk_input';
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


export interface FinalTranscriptionsMessage {
    type: 'final_transcriptions';
    transcriptions: string[];
}