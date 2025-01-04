import { AssemblyAI, RealtimeTranscript } from "assemblyai";
import { config } from "../config";

interface STTHandler {
    sendAudioChunk: (chunk: Buffer) => Promise<void>;
    close: () => Promise<void>;
}

export async function streamSTT(
    onTranscription: (text: string) => void,
    sampleRate = 16000
): Promise<STTHandler> {
    const client = new AssemblyAI({ apiKey: config.ASSEMBLY_AI_API_KEY });
    const transcriber = client.realtime.transcriber({ sampleRate });

    transcriber.on("open", ({ sessionId }) => {
        console.log(`Session opened with ID: ${sessionId}`);
    });

    transcriber.on("error", (error: Error) => {
        console.error("AssemblyAI error:", error);
    });

    transcriber.on("close", (code: number, reason: string) => {
        console.log("Session closed:", code, reason);
    });

    transcriber.on("transcript", (transcript: RealtimeTranscript) => {
        if (transcript.text && transcript.message_type === "FinalTranscript") {
            console.log("Final:", transcript.text);
            onTranscription(transcript.text);
        }
    });

    console.log("Connecting to real-time transcript service.");
    await transcriber.connect();

    return {
        async sendAudioChunk(chunk: Buffer) {
            transcriber.sendAudio(chunk);
        },
        async close() {
            console.log("Closing AssemblyAI transcriber connection.");
            await transcriber.close();
        },
    };
}
