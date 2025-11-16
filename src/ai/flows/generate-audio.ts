'use server';

/**
 * @fileOverview An AI flow for generating audio from text (Text-to-Speech).
 *
 * - generateAudio - A function that generates audio based on a text prompt.
 * - GenerateAudioInput - The input type for the generateAudio function.
 * - GenerateAudioOutput - The return type for the generateAudio function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { googleAI } from '@genkit-ai/google-genai';
import wav from 'wav';

// Define Zod schemas for structured input and output

const GenerateAudioInputSchema = z.object({
  text: z.string().describe('The text to convert to speech.'),
});
export type GenerateAudioInput = z.infer<typeof GenerateAudioInputSchema>;


const GenerateAudioOutputSchema = z.object({
  audioUrl: z
    .string()
    .describe(
      "The generated audio as a data URI. Expected format: 'data:audio/wav;base64,<encoded_data>'."
    ),
});
export type GenerateAudioOutput = z.infer<typeof GenerateAudioOutputSchema>;


/**
 * Helper function to convert raw PCM audio data to a WAV file format.
 * @param pcmData Buffer containing the raw PCM audio data.
 * @returns A Promise that resolves to a Base64 encoded string of the WAV file.
 */
async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}


const generateAudioFlow = ai.defineFlow(
  {
    name: 'generateAudioFlow',
    inputSchema: GenerateAudioInputSchema,
    outputSchema: GenerateAudioOutputSchema,
  },
  async (input) => {
    console.log('[generateAudioFlow] Starting audio generation for text...');
    
    // Generate the raw audio data from the Gemini TTS model.
    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Algenib' }, // A pleasant Arabic male voice
          },
        },
      },
      prompt: input.text,
    });

    if (!media) {
      throw new Error('No audio media was returned from the model.');
    }
    
    // The model returns a data URI with raw PCM data. We need to convert it to a WAV file.
    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    
    // Convert the PCM buffer to a WAV buffer and then to a Base64 string.
    const wavBase64 = await toWav(audioBuffer);
    
    console.log('[generateAudioFlow] Audio generation successful.');

    return {
      audioUrl: `data:audio/wav;base64,${wavBase64}`,
    };
  }
);


export async function generateAudio(
  input: GenerateAudioInput
): Promise<GenerateAudioOutput> {
  return generateAudioFlow(input);
}
