'use server';

/**
 * @fileOverview An AI flow for generating images from a text prompt.
 *
 * - generateImage - A function that generates an image based on a prompt.
 * - GenerateImageInput - The input type for the generateImage function.
 * - GenerateImageOutput - The return type for the generateImage function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateImageInputSchema = z.object({
  prompt: z.string().describe('The text prompt to generate an image from.'),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

const GenerateImageOutputSchema = z.object({
  imageUrl: z
    .string()
    .describe(
      "The generated image as a data URI. Expected format: 'data:image/png;base64,<encoded_data>'."
    ),
  imageHint: z.string().describe('A two-word hint for the image content.'),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

export async function generateImage(
  input: GenerateImageInput
): Promise<GenerateImageOutput> {
  return generateImageFlow(input);
}

const imageGenerationPrompt = ai.definePrompt({
    name: 'generateImagePrompt',
    input: { schema: GenerateImageInputSchema },
    prompt: `Create a photorealistic image that visually represents the following concept: {{{prompt}}}. The image should be suitable for a blog post header. Ensure the style is modern and professional.`,
});


const generateImageFlow = ai.defineFlow(
  {
    name: 'generateImageFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: GenerateImageOutputSchema,
  },
  async (input) => {
    const { media } = await ai.generate({
        model: 'googleai/imagen-4.0-fast-generate-001',
        prompt: input.prompt,
    });
    
    const imageHint = input.prompt.split(' ').slice(0, 2).join(' ');

    return {
      imageUrl: media.url,
      imageHint: imageHint,
    };
  }
);
