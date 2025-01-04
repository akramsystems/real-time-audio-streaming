import WebSocket from "ws";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import {
  AudioConfig,
  ConfigMessage,
  AudioStreamConfig,
  AudioEncoding,
} from "../src/types";

const WEBSOCKET_URL = "ws://localhost:8080";

const DEFAULT_STREAM_CONFIG: AudioStreamConfig = {
  chunkSize: 1024,
  streamIntervalMs: 10,
  audioFilePath: path.join(__dirname, "audio/test-audio.wav"),
};

const DEFAULT_AUDIO_CONFIG: AudioConfig = {
  sampleRate: 16000,
  channels: 1,
  encoding: AudioEncoding.WAV,
};

function createConfigMessage(): ConfigMessage {
  return {
    type: "initial_config",
    audio: DEFAULT_AUDIO_CONFIG,
  };
}

async function mimicAudioStream() {
  const ws = new WebSocket(WEBSOCKET_URL);
  const randomFileName = `output-${crypto.randomBytes(4).toString("hex")}.mp3`;
  const writeStream = fs.createWriteStream(randomFileName);

  ws.on("open", () => {
    console.log("Connected to WebSocket server.");
    ws.send(JSON.stringify(createConfigMessage()));
  });

  ws.on("message", (data: Buffer) => {
    const response = JSON.parse(data.toString());
    if (response.type === "start_audio_upload") {
      startAudioUploadStream(ws);
    } else if (response.type === "audio") {
      const audioBuffer = Buffer.from(response.data, "base64");
      writeStream.write(audioBuffer);
      console.log(`Audio appended to ${randomFileName}`);
    } else if (response.error) {
      console.error("Error from server:", response.error);
    }
  });

  ws.on("close", () => {
    writeStream.end();
    console.log("WebSocket connection closed.");
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
}

function startAudioUploadStream(ws: WebSocket) {
  console.log("Starting audio upload stream...");
  const audioFile = fs.readFileSync(DEFAULT_STREAM_CONFIG.audioFilePath);
  let offset = 0;

  const intervalHandle = setInterval(() => {
    if (offset >= audioFile.length) {
      clearInterval(intervalHandle);
      ws.send(JSON.stringify({ type: "end_audio_chunk_input" }));
      return;
    }
    const chunk = audioFile.slice(offset, offset + DEFAULT_STREAM_CONFIG.chunkSize);
    const audioMessage = { type: "audio_chunk_input", data: chunk.toString("base64") };
    ws.send(JSON.stringify(audioMessage));
    offset += DEFAULT_STREAM_CONFIG.chunkSize;
  }, DEFAULT_STREAM_CONFIG.streamIntervalMs);
}

mimicAudioStream().catch((error) => {
  console.error("Error in client:", error);
});
