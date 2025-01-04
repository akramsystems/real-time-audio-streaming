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
  const emitter = new EventEmitter() as TTSHandler;
  const ws = new WebSocket(
    `wss://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream-input?model_id=${modelId}`,
    {
      headers: { "xi-api-key": config.ELEVENLABS_API_KEY },
    }
  );

  ws.on("open", () => {
    // NOTE: This follows the pattern of the elevenlabs api docs
    ws.send(
      JSON.stringify({
        text: " ",
        voice_settings: { stability: 0.5, similarity_boost: 0.8, use_speaker_boost: false },
        generation_config: { chunk_length_schedule: [120, 160, 250, 290] },
      })
    );
    ws.send(JSON.stringify({ text }));
    ws.send(JSON.stringify({ text: "" }));
  });

  ws.on("message", (raw) => {
    try {
      const parsed = JSON.parse(raw.toString());
      if (parsed.audio) {
        const audioBuffer = Buffer.from(parsed.audio, "base64");
        emitter.emit("audio", audioBuffer);
      }
    } catch (err) {
      emitter.emit("error", err);
    }
  });

  ws.on("close", () => emitter.emit("close"));
  ws.on("error", (error) => emitter.emit("error", error));

  emitter.sendText = async (newText: string) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ text: newText }));
    } else {
      console.warn("WebSocket not open. Cannot send text.");
    }
  };

  emitter.close = async () => {
    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
      ws.close();
    }
  };

  return emitter;
}