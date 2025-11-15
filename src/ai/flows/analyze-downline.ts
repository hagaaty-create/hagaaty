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
  summary: z.string().describe("A short, encouraging, and actionable summary in Arabic about the user's network growth, acting as a personal marketing coach."),
});
export type DownlineAnalysisOutput = z.infer<typeof DownlineAnalysisOutputSchema>;


const analysisPrompt = ai.definePrompt({
    name: 'analyzeDownlineSummaryPrompt',
    input: { schema: DownlineAnalysisInputSchema },
    output: { schema: DownlineAnalysisOutputSchema },
    prompt: `أنت مدرب تسويق شبكي شخصي وخبير تحفيزي. مهمتك هي تحليل بيانات شبكة المستخدم وتقديم نصيحة قصيرة، ذكية، وقابلة للتنفيذ باللغة العربية.

البيانات:
- المستوى 1: {{{levels.[0].count}}} أعضاء
- المستوى 2: {{{levels.[1].count}}} أعضاء
- المستوى 3: {{{levels.[2].count}}} أعضاء
- المستوى 4: {{{levels.[3].count}}} أعضاء
- المستوى 5: {{{levels.[4].count}}} أعضاء

سيناريوهات ونصائح مقترحة:
- **إذا كانت الشبكة فارغة:** شجع المستخدم على اتخاذ الخطوة الأولى. مثال: "كل رحلة تبدأ بخطوة. أفضل طريقة للبدء هي مشاركة رابط الإحالة الخاص بك مع 3-5 أصدقاء مهتمين بالتسويق. استخدم 'نص الرسالة المباشرة' في صفحة أدوات التسويق!"
- **إذا كان المستوى الأول ينمو ولكن المستويات الأخرى فارغة:** امدح جهوده وشجعه على تدريب فريقه. مثال: "عمل رائع في بناء فريقك المباشر! حان الوقت الآن لمساعدتهم على النمو. شجع فريقك على استخدام 'أدوات التسويق' لجذب أعضائهم الأوائل."
- **إذا كانت المستويات الأدنى تنمو:** أشر إلى أن فريقه نشط وأن النمو يتضاعف. مثال: "تهانينا! شبكتك تنمو بشكل أعمق، وهذا يعني أن فريقك نشط وينسخ نجاحك. استمر في دعمهم لتحقيق المزيد من التوسع."
- **إذا كان هناك نمو في المستوى الأول فقط:** حفزه على التركيز على دعم فريقه. مثال: "لديك أساس قوي في المستوى الأول. ركز هذا الأسبوع على التواصل معهم ومساعدتهم على تحقيق أول إحالة لهم."

اكتب نصيحة واحدة فقط بناءً على السيناريو الأنسب للبيانات. كن دائمًا إيجابيًا ومحفزًا.`,
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
