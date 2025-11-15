'use server';
/**
 * @fileOverview An AI agent that analyzes an article's SEO and suggests improvements.
 *
 * - analyzeArticleSeo - The main function that orchestrates the analysis.
 * - AnalyzeArticleSeoInput - The input type for the function.
 * - AnalyzeArticleSeoOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Define input and output schemas
export const AnalyzeArticleSeoInputSchema = z.object({
  title: z.string().describe('The current title of the article.'),
  content: z.string().describe('The first 200 characters of the article content.'),
});
export type AnalyzeArticleSeoInput = z.infer<typeof AnalyzeArticleSeoInputSchema>;


export const AnalyzeArticleSeoOutputSchema = z.object({
  suggestedTitle: z.string().describe("A new, more engaging and SEO-friendly title in Arabic."),
  reason: z.string().describe("A very short explanation in Arabic for why the new title is better."),
});
export type AnalyzeArticleSeoOutput = z.infer<typeof AnalyzeArticleSeoOutputSchema>;


const analysisPrompt = ai.definePrompt({
    name: 'analyzeArticleSeoPrompt',
    input: { schema: AnalyzeArticleSeoInputSchema },
    output: { schema: AnalyzeArticleSeoOutputSchema },
    prompt: `أنت خبير في تحسين محركات البحث (SEO) وكتابة العناوين الجذابة باللغة العربية. مهمتك هي تحليل عنوان ومحتوى مقال واقتراح عنوان جديد أفضل.

البيانات الحالية:
- العنوان الحالي: {{{title}}}
- مقتطف من المحتوى: {{{content}}}

مهمتك:
1.  اقرأ العنوان والمحتوى لفهم جوهر المقال.
2.  ابتكر عنوانًا جديدًا يكون:
    - أكثر جاذبية وإثارة للفضول.
    - مناسبًا لمحركات البحث (قد يتضمن أرقامًا أو أسئلة أو كلمات قوية).
    - يعكس المحتوى بدقة.
3.  قدم سببًا مختصرًا جدًا (جملة واحدة) يشرح لماذا العنوان الجديد أفضل من القديم (مثال: "يستخدم أسلوب السؤال لإثارة فضول القارئ" أو "يحتوي على رقم وهو أكثر تحديدًا").

يجب ألا يكون العنوان الجديد هو نفسه العنوان الحالي. كن مبدعًا.`,
});


const analyzeArticleSeoFlow = ai.defineFlow(
  {
    name: 'analyzeArticleSeoFlow',
    inputSchema: AnalyzeArticleSeoInputSchema,
    outputSchema: AnalyzeArticleSeoOutputSchema,
  },
  async (input) => {
    const { output } = await analysisPrompt(input);
    if (!output) {
      throw new Error('Failed to generate SEO analysis.');
    }
    return output;
  }
);


export async function analyzeArticleSeo(
  input: AnalyzeArticleSeoInput
): Promise<AnalyzeArticleSeoOutput> {
  return analyzeArticleSeoFlow(input);
}
