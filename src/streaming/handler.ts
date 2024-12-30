import { WebSocket } from "ws";
import { 
    AudioConfig, 
    WebSocketMessage, 
    ConfigMessage,
    StatusMessage,
    ErrorMessage 
} from "../types";
import AudioStreamManager from "./manager";

function createStatusMessage(status: StatusMessage['status']): StatusMessage {
    return { type: 'status', status };
}

function createErrorMessage(error: string): ErrorMessage {
    return { type: 'error', error };
}

export async function handleWebSocketConnection(ws: WebSocket): Promise<void> {
    const streamManager = AudioStreamManager.getInstance();
    const state: {
        isConfigured: boolean;
    } = {
        isConfigured: false
    };

    const handleConfig = async (config: ConfigMessage) => {
        try {
            console.log("Starting config handling...");
            const audioConfig = config.audio;
            
            if (!isValidAudioConfig(audioConfig)) {
                throw new Error("Invalid audio configuration");
            }

            await streamManager.startStream(audioConfig);
            state.isConfigured = true;
            
            ws.send(JSON.stringify(createStatusMessage('ready')));
        } catch (error) {
            ws.send(JSON.stringify(createErrorMessage('Failed to process configuration')));
            ws.close();
        }
    };

    ws.on("message", async (message: Buffer) => {
        try {
            const jsonMessage = JSON.parse(message.toString());
            
            if (jsonMessage.type === 'config' && jsonMessage.audio) {
                await handleConfig(jsonMessage);
                return;
            }
            
            if (jsonMessage.type === 'audio' && jsonMessage.data) {
                if (!state.isConfigured) {
                    ws.send(JSON.stringify({ error: "Configuration required before sending audio" }));
                    return;
                }
                // Convert base64 back to buffer
                const audioBuffer = Buffer.from(jsonMessage.data, 'base64');
                await streamManager.processAudioChunk(audioBuffer);
                return;
            }

            if (jsonMessage.type === 'end') {
                await streamManager.stopStream();
                return;
            }
        } catch (error) {
            console.error("Error processing message:", error);
            ws.send(JSON.stringify({ error: "Failed to process message" }));
        }
    });

    ws.on("close", async () => {
        try {
            if (streamManager.isStreamActive()) {
                await streamManager.stopStream();
            }
        } catch (error) {
            console.error("Error closing stream:", error);
        }
    });
}

function isValidAudioConfig(config: AudioConfig): boolean {
    return !!(config.sampleRate && config.channels && config.encoding);
}