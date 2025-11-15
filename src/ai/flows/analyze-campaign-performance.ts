'use server';
/**
 * @fileOverview An AI agent that analyzes the performance of a single ad campaign.
 *
 * - analyzeCampaignPerformance - The main function that orchestrates the analysis.
 * - CampaignPerformanceInput - The input type for the function.
 * - CampaignPerformanceOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Define input and output schemas
export const CampaignPerformanceInputSchema = z.object({
  productName: z.string(),
  impressions: z.number(),
  clicks: z.number(),
});
export type CampaignPerformanceInput = z.infer<typeof CampaignPerformanceInputSchema>;


export const CampaignPerformanceOutputSchema = z.object({
  analysis: z.string().describe("A very short, actionable analysis in Arabic (max 2 sentences) about the campaign's performance, acting as an expert ads analyst."),
});
export type CampaignPerformanceOutput = z.infer<typeof CampaignPerformanceOutputSchema>;


const analysisPrompt = ai.definePrompt({
    name: 'analyzeCampaignPerformancePrompt',
    input: { schema: CampaignPerformanceInputSchema },
    output: { schema: CampaignPerformanceOutputSchema },
    prompt: `أنت خبير في الإعلانات الرقمية. مهمتك هي تحليل أداء حملة إعلانية وتقديم نصيحة قصيرة جدًا وذكية باللغة العربية.

البيانات:
- اسم المنتج: {{{productName}}}
- مرات الظهور (Impressions): {{{impressions}}}
- النقرات (Clicks): {{{clicks}}}

معدل النقر إلى الظهور (CTR) هو: {{#if impressions}}{{math clicks '/' impressions format="0.00%"}}{{else}}0%{{/if}}

سيناريوهات ونصائح مقترحة (اختر واحدة فقط):
- **CTR > 5% (أداء ممتاز):** "أداء ممتاز! نسبة النقر إلى الظهور عالية جدًا، مما يدل على أن إعلانك جذاب للغاية لجمهورك."
- **2% < CTR <= 5% (أداء جيد):** "أداء جيد! الحملة تحقق نتائج قوية. فكّر في زيادة الميزانية لتوسيع نطاق الوصول."
- **1% < CTR <= 2% (أداء مقبول):** "بداية مقبولة. الإعلان يعمل، لكن ربما يمكن تحسين العنوان أو النص لزيادة جاذبيته."
- **CTR <= 1% (أداء ضعيف):** "الحملة تحتاج إلى تحسين. نسبة النقر منخفضة، جرب تغيير العنوان أو استهداف جمهور مختلف."
- **نقرات قليلة جدًا (clicks < 5):** "ما زالت الحملة في بدايتها. انتظر حتى تجمع المزيد من البيانات للحصول على تحليل دقيق."

اكتب تحليلًا واحدًا فقط بناءً على السيناريو الأنسب. كن مباشرًا وموجزًا.`,
});


const analyzeCampaignPerformanceFlow = ai.defineFlow(
  {
    name: 'analyzeCampaignPerformanceFlow',
    inputSchema: CampaignPerformanceInputSchema,
    outputSchema: CampaignPerformanceOutputSchema,
  },
  async (input) => {
    const { output } = await analysisPrompt(input);
    if (!output) {
      throw new Error('Failed to generate campaign analysis.');
    }
    return {
      analysis: output.analysis,
    };
  }
);


export async function analyzeCampaignPerformance(
  input: CampaignPerformanceInput
): Promise<CampaignPerformanceOutput> {
  return analyzeCampaignPerformanceFlow(input);
}
