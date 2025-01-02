import { AssemblyAI, RealtimeTranscript } from "assemblyai";
import { config } from "../config";

interface STTHandler {
    sendAudioChunk: (chunk: Buffer) => Promise<void>;
    close: () => Promise<void>;
}

export async function streamSTT(
    onTranscription: (text: string) => void,
    sampleRate: number = 16_000
): Promise<STTHandler> {
    // Initialize AssemblyAI client
    const client = new AssemblyAI({
        apiKey: config.ASSEMBLY_AI_API_KEY,
    });

    // Create a real-time transcriber
    const transcriber = client.realtime.transcriber({
        sampleRate: sampleRate,
    });

    // Register event handlers
    transcriber.on("open", ({ sessionId }) => {
        console.log(`Session opened with ID: ${sessionId}`);
    });

    transcriber.on("error", (error: Error) => {
        console.error("Error:", error);
    });

    transcriber.on("close", (code: number, reason: string) => {
        console.log("Session closed:", code, reason);
    });

    transcriber.on("transcript", (transcript: RealtimeTranscript) => {
        if (!transcript.text) return;

        if (transcript.message_type === "FinalTranscript") {
            console.log("Final:", transcript.text);
            onTranscription(transcript.text);
        }
    });

    console.log("Connecting to real-time transcript service");
    await transcriber.connect();

    return {
        sendAudioChunk: async (chunk: Buffer) => {
            transcriber.sendAudio(chunk);
        },
        close: async () => {
            console.log("Closing AssemblyAI transcriber connection");
            await transcriber.close();
        },
    };
}
