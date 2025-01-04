import { WebSocket } from "ws";
import { 
    AudioConfig, 
    WebSocketMessage,
    ConfigMessage,
} from "../types";
import { processTranscription } from "../services/openai";
import { StreamHandler } from "../types";
import AudioStreamManager from "./manager";
import { streamTTS } from "../services/tts";

class WebSocketHandler implements StreamHandler {
    private ws: WebSocket;
    private audioStreamManager: AudioStreamManager;
    private state = {
        isConfigured: false
    };

    constructor(ws: WebSocket) {
        this.ws = ws;
        this.audioStreamManager = AudioStreamManager.getInstance();
        this.initialize();
    }

    private initialize(): void {
        this.ws.on("message", this.handleMessage.bind(this));
        this.ws.on("close", this.handleClose.bind(this));
        this.ws.on("error", this.handleError.bind(this));
    }

    async handleAudioChunk(message: any): Promise<void> {
        if (!this.state.isConfigured) {
            this.sendError("Configuration required before sending audio");
            return;
        }

        const audioBuffer = Buffer.from(message.data, 'base64');
        await this.audioStreamManager.processAudioChunk(audioBuffer);
    }

    async handleTranscription(): Promise<void> {
        const transcriptions = await this.audioStreamManager.stopStream();
        
        this.send({
            type: 'final_transcriptions',
            transcriptions: transcriptions
        });

        const combinedTranscription = transcriptions.join(" ");

        try {
            const aiResponse = await processTranscription(combinedTranscription);
            this.send({
                type: 'ai_response',
                response: aiResponse
            });

            const ttsHandler = await streamTTS(aiResponse);
            
            ttsHandler.on('audio', (audioData: Buffer) => {
                this.ws.send(JSON.stringify({
                    type: 'audio',
                    data: audioData.toString('base64')
                }));
            });

            ttsHandler.on('close', () => {
                console.log("TTS process completed and connection closed.");
            });

            
              
        } catch (error) {
            console.error("Error processing transcription with OpenAI:", error);
            this.sendError("Failed to process transcription with OpenAI");
        }
    }

    private async handleMessage(message: Buffer): Promise<void> {
        try {
            const parsedMessage = this.parseMessage(message);
            await this.routeMessage(parsedMessage);
        } catch (error) {
            this.sendError("Failed to process message");
        }
    }

    private parseMessage(message: Buffer): WebSocketMessage {
        try {
            return JSON.parse(message.toString());
        } catch {
            throw new Error("Invalid message format");
        }
    }

    private async routeMessage(message: WebSocketMessage): Promise<void> {
        switch (message.type) {
            case 'initial_config':
                await this.handleConfig(message as ConfigMessage);
                break;
            case 'audio_chunk_input':
                await this.handleAudioChunk(message);
                break;
            case 'end_audio_chunk_input':
                await this.handleTranscription();
                break;
            default:
                this.sendError("Unknown message type");
        }
    }

    private async handleConfig(config: ConfigMessage): Promise<void> {
        try {
            if (!this.isValidAudioConfig(config.audio)) {
                throw new Error("Invalid audio configuration");
            }
            await this.audioStreamManager.startStream(config.audio);
            this.state.isConfigured = true;
            this.send({ type: 'start_audio_upload' });
        } catch (error) {
            this.sendError('Failed to process configuration');
            this.ws.close();
        }
    }


    private async handleClose(): Promise<void> {
        try {
            if (this.audioStreamManager.isStreamActive()) {
                await this.audioStreamManager.stopStream();
            }
        } catch (error) {
            console.error("Error during cleanup:", error);
        }
    }

    private handleError(error: Error): void {
        console.error("WebSocket error:", error);
        this.sendError("Internal server error");
    }


    private sendError(error: string): void {
        this.send({ type: 'error', error });
    }

    private send(message: WebSocketMessage): void {
        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        }
    }

    private isValidAudioConfig(config: AudioConfig): boolean {
        return !!(config?.sampleRate && config?.channels && config?.encoding);
    }
}

export function createWebSocketHandler(ws: WebSocket): void {
    new WebSocketHandler(ws);
}