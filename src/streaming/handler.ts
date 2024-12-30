import { WebSocket } from "ws";
import { 
    AudioConfig, 
    WebSocketMessage,
    ConfigMessage,
    StatusMessage,
    ErrorMessage 
} from "../types";
import AudioStreamManager from "./manager";

class WebSocketHandler {
    private ws: WebSocket;
    private streamManager: AudioStreamManager;
    private state = {
        isConfigured: false
    };

    constructor(ws: WebSocket) {
        this.ws = ws;
        this.streamManager = AudioStreamManager.getInstance();
        this.initialize();
    }

    private initialize(): void {
        this.ws.on("message", this.handleMessage.bind(this));
        this.ws.on("close", this.handleClose.bind(this));
        this.ws.on("error", this.handleError.bind(this));
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
            case 'config':
                await this.handleConfig(message as ConfigMessage);
                break;
            case 'audio':
                await this.handleAudio(message);
                break;
            case 'end':
                await this.handleEnd();
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

            await this.streamManager.startStream(config.audio);
            this.state.isConfigured = true;
            this.sendStatus('ready');
        } catch (error) {
            this.sendError('Failed to process configuration');
            this.ws.close();
        }
    }

    private async handleAudio(message: any): Promise<void> {
        if (!this.state.isConfigured) {
            this.sendError("Configuration required before sending audio");
            return;
        }

        const audioBuffer = Buffer.from(message.data, 'base64');
        await this.streamManager.processAudioChunk(audioBuffer);
    }

    private async handleEnd(): Promise<void> {
        const transcriptions = await this.streamManager.stopStream();
        this.send({
            type: 'final_transcriptions',
            transcriptions: transcriptions
        });
        return;
    }

    private async handleClose(): Promise<void> {
        try {
            if (this.streamManager.isStreamActive()) {
                await this.streamManager.stopStream();
            }
        } catch (error) {
            console.error("Error during cleanup:", error);
        }
    }

    private handleError(error: Error): void {
        console.error("WebSocket error:", error);
        this.sendError("Internal server error");
    }

    private sendStatus(status: StatusMessage['status']): void {
        this.send({ type: 'status', status });
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