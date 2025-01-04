import OpenAI from 'openai';
import { config } from '../config';

const openai = new OpenAI({
    apiKey: config.OPENAI_API_KEY
});

export async function processTranscription(transcription: string): Promise<string> {
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: "You are a helpful assistant. Answer questions clearly and concisely.",
                },
                {
                    role: "user",
                    content: transcription,
                },
            ],
            temperature: 0.7,
        });
        const content = completion.choices[0].message.content;
        console.log("OpenAI Response:", content);
        return content || "Sorry, I couldn't generate a response.";
    } catch (error) {
        console.error("Error calling OpenAI:", error);
        throw new Error("Failed to process transcription with OpenAI");
    }
}
