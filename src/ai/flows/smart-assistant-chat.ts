'use server';

/**
 * @fileOverview An AI agent for a smart assistant chat interface.
 *
 * - smartAssistantChat - A function that handles the smart assistant chat process.
 * - SmartAssistantChatInput - The input type for the smartAssistantChat function.
 * - SmartAssistantChatOutput - The return type for the smartAssistantChat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SmartAssistantChatInputSchema = z.object({
  query: z.string().describe('The user query for the smart assistant.'),
});
export type SmartAssistantChatInput = z.infer<typeof SmartAssistantChatInputSchema>;

const SmartAssistantChatOutputSchema = z.object({
  response: z.string().describe('The response from the smart assistant.'),
});
export type SmartAssistantChatOutput = z.infer<typeof SmartAssistantChatOutputSchema>;

export async function smartAssistantChat(input: SmartAssistantChatInput): Promise<SmartAssistantChatOutput> {
  return smartAssistantChatFlow(input);
}

const prompt = ai.definePrompt({
  name: 'smartAssistantChatPrompt',
  input: {schema: SmartAssistantChatInputSchema},
  output: {schema: SmartAssistantChatOutputSchema},
  prompt: `You are a smart assistant for the Hagaaty blog. Answer user questions based on the content of the blog.

User Query: {{{query}}}`,
});

const smartAssistantChatFlow = ai.defineFlow(
  {
    name: 'smartAssistantChatFlow',
    inputSchema: SmartAssistantChatInputSchema,
    outputSchema: SmartAssistantChatOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
