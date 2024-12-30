import WebSocket from "ws";
import fs from "fs";
import path from "path";
import { 
    AudioConfig, 
    ConfigMessage, 
    AudioStreamConfig,
    AudioEncoding 
} from "../src/types";

const WEBSOCKET_URL = "ws://localhost:8080";

const DEFAULT_STREAM_CONFIG: AudioStreamConfig = {
    chunkSize: 1024,
    streamIntervalMs: 10,
    audioFilePath: path.join(__dirname, "audio/test-audio.wav")
};

const DEFAULT_AUDIO_CONFIG: AudioConfig = {
    sampleRate: 16000,
    channels: 1,
    encoding: AudioEncoding.WAV
};

function createConfigMessage(): ConfigMessage {
    return {
        type: 'config',
        audio: DEFAULT_AUDIO_CONFIG
    };
}

async function mimicAudioStream(
) {
    const ws = new WebSocket(WEBSOCKET_URL);
    let isReady = false;

    ws.on("open", () => {
        console.log("Connected to the WebSocket server.");
        
        // Send audio configuration first
        const audioConfig = createConfigMessage();
        console.log("Sending config:", audioConfig);
        ws.send(JSON.stringify(audioConfig));
    });

    ws.on("message", (data) => {
        const response = JSON.parse(data.toString());
        console.log("Received server response:", response);

        if (response.status === "ready") {
            console.log("Server confirmed ready status, starting audio stream...");
            isReady = true;
            startAudioStream(ws);
        } else if (response.transcription) {
            console.log("Transcription:", response.transcription);
        } else if (response.type === 'final_transcriptions') {
            console.log("Complete transcript:", response.transcriptions.join(" "));
        } else if (response.answer) {
            console.log("AI Answer:", response.answer);
        } else if (response.error) {
            console.error("Error from server:", response.error);
        }
    });

    ws.on("close", () => {
        console.log("WebSocket connection closed.");
    });

    ws.on("error", (error) => {
        console.error("WebSocket error:", error);
    });
}

function startAudioStream(ws: WebSocket) {
    console.log("Starting audio stream...");
    const audioFile = fs.readFileSync(DEFAULT_STREAM_CONFIG.audioFilePath);
    let offset = 0;

    const streamInterval = setInterval(() => {
        if (offset >= audioFile.length) {
            console.log("Audio streaming completed");
            clearInterval(streamInterval);
            ws.send(JSON.stringify({ type: 'end' }));
            return;
        }

        const chunk = audioFile.slice(offset, offset + DEFAULT_STREAM_CONFIG.chunkSize);
        const audioMessage = {
            type: 'audio',
            data: chunk.toString('base64')
        };
        console.log(`Sending chunk of size ${chunk.length} at offset ${offset}`);
        ws.send(JSON.stringify(audioMessage));
        offset += DEFAULT_STREAM_CONFIG.chunkSize;
    }, DEFAULT_STREAM_CONFIG.streamIntervalMs);
}

mimicAudioStream().catch((error) => {
    console.error("Error in client:", error);
});
