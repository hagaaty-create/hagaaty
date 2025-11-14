'use server';

/**
 * @fileOverview An AI agent for a smart assistant chat interface that can answer questions and navigate the user.
 *
 * - smartAssistantChat - A function that handles the smart assistant chat process.
 * - SmartAssistantChatInput - The input type for the smartAssistantChat function.
 * - SmartAssistantChatOutput - The return type for the smartAssistantChat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {getFirestore} from 'firebase-admin/firestore';
import {getApps, initializeApp} from 'firebase-admin/app';

// Initialize Firebase Admin SDK if not already initialized
if (!getApps().length) {
  initializeApp();
}

const SmartAssistantChatInputSchema = z.object({
  query: z.string().describe('The user query for the smart assistant.'),
});
export type SmartAssistantChatInput = z.infer<
  typeof SmartAssistantChatInputSchema
>;

const SmartAssistantChatOutputSchema = z.object({
  response: z.string().describe('The text response from the smart assistant.'),
});
export type SmartAssistantChatOutput = z.infer<
  typeof SmartAssistantChatOutputSchema
>;

const navigateTo = ai.defineTool(
  {
    name: 'navigateTo',
    description: 'يُستخدم لتوجيه المستخدم إلى صفحة معينة داخل التطبيق.',
    inputSchema: z.object({
      path: z.string().describe('المسار الذي سيتم توجيه المستخدم إليه، مثال: /login, /blog, /dashboard'),
    }),
    outputSchema: z.void(),
  },
  async () => {
    // This function doesn't need to do anything on the server.
    // The client will handle the navigation.
  }
);


export async function smartAssistantChat(
  input: SmartAssistantChatInput
) {
  return await ai.generate({
    prompt: `أنت مساعد ذكاء اصطناعي شامل وودود. هدفك هو الإجابة على أسئلة المستخدمين باللغة العربية بدقة وتقديم المساعدة في مجموعة واسعة من المهام. كن مفيداً ومبدعاً. إذا طلب منك المستخدم الذهاب لصفحة معينة، فاستخدم أداة navigateTo.

استعلام المستخدم: ${input.query}`,
    tools: [navigateTo],
    model: 'googleai/gemini-2.5-flash',
  });
}
