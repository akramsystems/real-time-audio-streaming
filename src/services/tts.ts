// src/services/tts.ts
import fs from "fs";
import WebSocket from "ws";
import { EventEmitter } from "events";
import { config } from "../config";

// TTSHandler interface from your manager:
export interface TTSHandler extends EventEmitter {
  sendText: (text: string) => Promise<void>;
  close: () => Promise<void>;
}

export async function streamTTS(
  text: string,
  voiceId: string = "Xb7hH8MSUJpSbSDYk0k2",
  modelId: string = "eleven_turbo_v2"
): Promise<TTSHandler> {
  const ELEVENLABS_API_KEY = config.ELEVENLABS_API_KEY;

  const emitter = new EventEmitter() as TTSHandler;
  const uri = `wss://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream-input?model_id=${modelId}`;

  // Create the WebSocket
  const ws = new WebSocket(uri, {
    headers: {
      "xi-api-key": ELEVENLABS_API_KEY, // ensure no extra spaces
    },
  });

  // When WebSocket connects, send three chunks (init placeholder, actual text, empty)
  ws.on("open", () => {
    // chunk #1: placeholder text + voice settings + generation config
    ws.send(
      JSON.stringify({
        text: " ",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8,
          use_speaker_boost: false,
        },
        generation_config: {
          chunk_length_schedule: [120, 160, 250, 290],
        },
      })
    );

    // chunk #2: the actual text
    ws.send(JSON.stringify({ text }));

    // chunk #3: empty string to signal end of text
    ws.send(JSON.stringify({ text: "" }));
  });

  // Listen for messages (audio chunks)
  ws.on("message", (rawData) => {
    try {
      const parsed = JSON.parse(rawData.toString());
      if (parsed.audio) {
        const audioBuffer = Buffer.from(parsed.audio, "base64");
        // Emit an 'audio' event with the raw Buffer
        emitter.emit("audio", audioBuffer);
      }
      // If ElevenLabs eventually sends isFinal or close, you could handle that here.
    } catch (err) {
      emitter.emit("error", err);
    }
  });

  // When the server closes the WS, emit 'close'
  ws.on("close", () => {
    emitter.emit("close");
  });

  // Forward errors to your emitter
  ws.on("error", (error) => {
    emitter.emit("error", error);
  });

  // Attach the TTSHandler methods
  emitter.sendText = async (newText: string) => {
    // If you plan to send additional text chunks after the first,
    // you can do that here. For a single prompt, you often won’t need this.
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ text: newText }));
    } else {
      console.warn("WebSocket not open. Cannot send text");
    }
  };

  emitter.close = async () => {
    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
      ws.close();
    }
  };

  return emitter;
}