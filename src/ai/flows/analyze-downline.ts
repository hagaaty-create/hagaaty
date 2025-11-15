'use server';
/**
 * @fileOverview An AI agent that analyzes a user's MLM downline data and provides a summary.
 *
 * - analyzeDownline - The main function that orchestrates the analysis.
 * - DownlineAnalysisInput - The input type for the function.
 * - DownlineAnalysisOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Define input and output schemas
export const DownlineLevelSchema = z.object({
  level: z.number().int().min(1).max(5),
  count: z.number().int(),
});

export const DownlineAnalysisInputSchema = z.object({
  levels: z.array(DownlineLevelSchema).length(5).describe("An array representing the user count for each of the 5 levels in the downline."),
});
export type DownlineAnalysisInput = z.infer<typeof DownlineAnalysisInputSchema>;


export const DownlineAnalysisOutputSchema = z.object({
  summary: z.string().describe("A short, encouraging summary in Arabic about the user's network growth."),
});
export type DownlineAnalysisOutput = z.infer<typeof DownlineAnalysisOutputSchema>;


const analysisPrompt = ai.definePrompt({
    name: 'analyzeDownlineSummaryPrompt',
    input: { schema: DownlineAnalysisInputSchema },
    output: { schema: DownlineAnalysisOutputSchema },
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
    inputSchema: DownlineAnalysisInputSchema,
    outputSchema: DownlineAnalysisOutputSchema,
  },
  async (input) => {
    // This flow NO LONGER fetches data. It only receives data and generates a summary.
    const { output } = await analysisPrompt(input);
    if (!output) {
      throw new Error('Failed to generate downline summary.');
    }
    return {
      summary: output.summary,
    };
  }
);


// Exported function to be called from the frontend
export async function analyzeDownline(
  input: DownlineAnalysisInput
): Promise<DownlineAnalysisOutput> {
  return analyzeDownlineFlow(input);
}
