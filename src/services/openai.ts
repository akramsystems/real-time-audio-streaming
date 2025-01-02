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
                    content: "You are a helpful assistant. Answer any questions posed in the user's message clearly and concisely."
                },
                {
                    role: "user",
                    content: transcription
                }
            ],
            temperature: 0.7,
        });

        console.log("OpenAI Response:", completion.choices[0].message.content);

        return completion.choices[0].message.content || "Sorry, I couldn't generate a response.";
    } catch (error) {
        console.error('Error calling OpenAI:', error);
        throw new Error('Failed to process transcription with OpenAI');
    }
}
