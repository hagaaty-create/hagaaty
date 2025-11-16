'use server';

/**
 * @fileOverview An AI flow for generating short videos from a text prompt.
 *
 * - generateVideo - A function that generates a video based on a prompt.
 * - GenerateVideoInput - The input type for the generateVideo function.
 * - GenerateVideoOutput - The return type for the generateVideo function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { googleAI } from '@genkit-ai/googleai';


const GenerateVideoInputSchema = z.object({
  prompt: z.string().describe('The text prompt to generate a video from.'),
});
export type GenerateVideoInput = z.infer<typeof GenerateVideoInputSchema>;

const GenerateVideoOutputSchema = z.object({
  videoUrl: z
    .string()
    .describe(
      "The generated video as a data URI. Expected format: 'data:video/mp4;base64,<encoded_data>'."
    ),
});
export type GenerateVideoOutput = z.infer<typeof GenerateVideoOutputSchema>;


const generateVideoFlow = ai.defineFlow(
  {
    name: 'generateVideoFlow',
    inputSchema: GenerateVideoInputSchema,
    outputSchema: GenerateVideoOutputSchema,
  },
  async (input) => {
    console.log('[generateVideoFlow] Starting video generation...');
    
    let { operation } = await ai.generate({
        model: googleAI.model('veo-2.0-generate-001'),
        prompt: `A cinematic, professional short video ad representing the concept: ${input.prompt}`,
        config: {
            durationSeconds: 8,
            aspectRatio: '9:16', // Ideal for Reels/Shorts
        },
    });

    if (!operation) {
        throw new Error('Expected the model to return an operation.');
    }

    console.log('[generateVideoFlow] Polling for video completion...');
    // Poll for completion, waiting 5 seconds between checks.
    while (!operation.done) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        operation = await ai.checkOperation(operation);
        console.log(`[generateVideoFlow] Operation status: ${operation.done ? 'Done' : 'In Progress'}`);
    }

    if (operation.error) {
        console.error('[generateVideoFlow] Operation failed:', operation.error);
        throw new Error('Failed to generate video: ' + operation.error.message);
    }
    
    const videoPart = operation.output?.message?.content.find((p) => !!p.media);
    if (!videoPart || !videoPart.media?.url) {
        throw new Error('Failed to find the generated video in the operation output.');
    }

    console.log('[generateVideoFlow] Video generation successful.');
    
    // The URL from the operation is temporary and needs the API key to be accessed.
    // We fetch it and convert it to a data URI to make it permanent and embeddable.
    const fetch = (await import('node-fetch')).default;
    const videoDownloadResponse = await fetch(
        `${videoPart.media.url}&key=${process.env.GEMINI_API_KEY}`
    );

    if (!videoDownloadResponse.ok || !videoDownloadResponse.body) {
        throw new Error(`Failed to download video from temporary URL. Status: ${videoDownloadResponse.status}`);
    }

    const videoBuffer = await videoDownloadResponse.buffer();
    const videoDataUri = `data:video/mp4;base64,${videoBuffer.toString('base64')}`;

    return {
      videoUrl: videoDataUri,
    };
  }
);


export async function generateVideo(
  input: GenerateVideoInput
): Promise<GenerateVideoOutput> {
  return generateVideoFlow(input);
}
