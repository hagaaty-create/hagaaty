'use server';
/**
 * @fileOverview An AI agent that analyzes a user's MLM downline.
 *
 * - analyzeDownline - The main function that orchestrates the analysis.
 * - AnalyzeDownlineOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestore, collection, query, where, getDocs, limit } from 'firebase-admin/firestore';
import { getApps, initializeApp } from 'firebase-admin/app';

// Initialize Firebase Admin SDK if not already initialized
if (!getApps().length) {
  initializeApp();
}
const db = getFirestore();

// Define input and output schemas
export const AnalyzeDownlineInputSchema = z.object({
  userId: z.string().describe('The UID of the user whose downline is to be analyzed.'),
});
export type AnalyzeDownlineInput = z.infer<typeof AnalyzeDownlineInputSchema>;

export const DownlineLevelSchema = z.object({
  level: z.number().int().min(1).max(5),
  count: z.number().int(),
});

export const AnalyzeDownlineOutputSchema = z.object({
  levels: z.array(DownlineLevelSchema).length(5).describe("An array representing the user count for each of the 5 levels in the downline."),
  summary: z.string().describe("A short, encouraging summary in Arabic about the user's network growth."),
});
export type AnalyzeDownlineOutput = z.infer<typeof AnalyzeDownlineOutputSchema>;


const getDownlineTool = ai.defineTool(
  {
    name: 'getDownline',
    description: "Fetches the user count for each of the 5 levels in a user's MLM downline.",
    inputSchema: z.object({ userId: z.string() }),
    outputSchema: z.array(DownlineLevelSchema).length(5),
  },
  async ({ userId }) => {
    console.log(`[Tool:getDownline] Analyzing downline for user: ${userId}`);
    const counts = [
      { level: 1, count: 0 },
      { level: 2, count: 0 },
      { level: 3, count: 0 },
      { level: 4, count: 0 },
      { level: 5, count: 0 },
    ];

    const usersRef = collection(db, 'users');
    
    // We query for each level where the user's ID is in the `ancestors` array at the specific index.
    for (let i = 0; i < 5; i++) {
        // Firestore arrays are 0-indexed, so level 1 is at index 0.
        const q = query(usersRef, where(`ancestors.${i}`, '==', userId));
        const snapshot = await getDocs(q);
        counts[i] = { level: i + 1, count: snapshot.size };
    }
    
    console.log(`[Tool:getDownline] Analysis complete for user ${userId}:`, counts);
    return counts;
  }
);


const analysisPrompt = ai.definePrompt({
    name: 'analyzeDownlinePrompt',
    input: { schema: z.object({ levels: z.array(DownlineLevelSchema) }) },
    output: { schema: z.object({ summary: z.string() }) },
    prompt: `أنت خبير في تحفيز فرق التسويق الشبكي. بناءً على البيانات التالية التي توضح عدد الأعضاء في كل مستوى من مستويات شبكة المستخدم، اكتب ملخصًا قصيرًا ومشجعًا باللغة العربية (جملة أو جملتين).

البيانات:
- المستوى 1: {{{levels.[0].count}}} أعضاء
- المستوى 2: {{{levels.[1].count}}} أعضاء
- المستوى 3: {{{levels.[2].count}}} أعضاء
- المستوى 4: {{{levels.[3].count}}} أعضاء
- المستوى 5: {{{levels.[4].count}}} أعضاء

ركز على نقاط القوة. إذا كان المستوى الأول جيدًا، امدح جهوده في بناء فريقه المباشر. إذا كانت المستويات الأدنى تنمو، أشر إلى أن فريقه نشط وينمو بشكل جيد. إذا كانت الشبكة فارغة، شجعه على البدء بدعوة الأصدقاء.`,
});


const analyzeDownlineFlow = ai.defineFlow(
  {
    name: 'analyzeDownlineFlow',
    inputSchema: AnalyzeDownlineInputSchema,
    outputSchema: AnalyzeDownlineOutputSchema,
  },
  async ({ userId }) => {
    // 1. Get the downline data using the tool
    const levels = await getDownlineTool({ userId });

    // 2. Generate an encouraging summary with the AI
    const { output } = await analysisPrompt({ levels });
    if (!output) {
      throw new Error('Failed to generate downline summary.');
    }
    
    return {
      levels: levels,
      summary: output.summary,
    };
  }
);


// Exported function to be called from the frontend
export async function analyzeDownline(
  input: AnalyzeDownlineInput
): Promise<AnalyzeDownlineOutput> {
  return analyzeDownlineFlow(input);
}
