'use server';

/**
 * @fileOverview An AI agent for a smart assistant chat interface that can answer questions.
 *
 * - smartAssistantChat - A function that handles the smart assistant chat process.
 * - SmartAssistantChatInput - The input type for the smartAssistantChat function.
 * - SmartAssistantChatOutput - The return type for the smartAssistantChat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {getFirestore} from 'firebase-admin/firestore';
import {getApps, initializeApp} from 'firebase-admin/app';
import { SmartAssistantChatInputSchema, type SmartAssistantChatInput, SmartAssistantChatOutputSchema, type SmartAssistantChatOutput } from '@/types';


// Initialize Firebase Admin SDK if not already initialized
if (!getApps().length) {
  initializeApp();
}

export async function smartAssistantChat(
  input: SmartAssistantChatInput
): Promise<SmartAssistantChatOutput> {
  const result = await ai.generate({
    prompt: `أنت مساعد ذكاء اصطناعي شامل وودود. هدفك هو الإجابة على أسئلة المستخدمين باللغة العربية بدقة وتقديم المساعدة في مجموعة واسعة من المواضيع. كن مفيداً ومبدعاً.

استعلام المستخدم: ${input.query}`,
    model: 'googleai/gemini-2.5-flash',
  });
  
  return { response: result.text };
}
