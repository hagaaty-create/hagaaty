'use server';
/**
 * @fileOverview An AI agent that proactively analyzes a user's active campaigns and provides optimization advice.
 *
 * - proactiveCampaignAnalysis - The main function that orchestrates the analysis.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {
  ProactiveCampaignAnalysisInputSchema,
  ProactiveCampaignAnalysisOutputSchema,
  type ProactiveCampaignAnalysisInput,
  type ProactiveCampaignAnalysisOutput,
} from '@/types';


const analysisPrompt = ai.definePrompt({
    name: 'proactiveCampaignAnalysisPrompt',
    input: { schema: ProactiveCampaignAnalysisInputSchema },
    output: { schema: ProactiveCampaignAnalysisOutputSchema },
    prompt: `أنت مدرب تسويق خبير ومحلل بيانات. مهمتك هي تحليل أداء جميع الحملات النشطة لمستخدم وتقديم نصيحة واحدة فقط، ذكية، واستراتيجية باللغة العربية. يجب أن تكون النصيحة قابلة للتنفيذ ومحفزة.

هذه هي بيانات الحملات:
{{#each campaigns}}
- حملة "{{productName}}": CTR: {{math ctr format="0.00%"}}, النقرات: {{clicks}}, الظهور: {{impressions}}
{{/each}}

سيناريوهات مقترحة (اختر السيناريو الأنسب وقدم نصيحة فريدة بناءً عليه):

- **إذا كانت هناك حملة واحدة تتفوق بشكل كبير (CTR أعلى بفارق كبير):**
  - **مثال للنصيحة:** "عمل رائع! حملة '{{campaigns.[0].productName}}' تحقق أداءً استثنائيًا. فكّر في مضاعفة الاستثمار فيها أو إنشاء حملات مشابهة لمنتجات أخرى بنفس الأسلوب."
  - **isActionable:** true

- **إذا كانت هناك حملة ضعيفة الأداء بشكل واضح مقارنة بالأخريات:**
  - **مثال للنصيحة:** "تحليل سريع: حملة '{{campaigns.[0].productName}}' لا تحقق نفس مستوى التفاعل مثل حملاتك الأخرى. قد يكون من الحكمة إيقافها مؤقتًا وتركيز ميزانيتك على الحملات الأكثر نجاحًا."
  - **isActionable:** true

- **إذا كانت جميع الحملات ذات أداء متقارب وجيد (CTR > 2%):**
  - **مثال للنصيحة:** "تهانينا، جميع حملاتك تحقق أداءً جيدًا وثابتًا. أنت تسير على الطريق الصحيح نحو النجاح!"
  - **isActionable:** false (لا حاجة لإزعاج المستخدم)

- **إذا كانت جميع الحملات ضعيفة الأداء (CTR < 1%):**
  - **مثال للنصيحة:** "يبدو أن حملاتك الحالية لا تجذب الجمهور المستهدف. أقترح عليك تجربة زاوية تسويقية جديدة تمامًا أو مراجعة الكلمات الرئيسية في صفحة 'إنشاء إعلان'."
  - **isActionable:** true

- **إذا لم تكن هناك بيانات كافية (نقرات قليلة جدًا):**
  - **مثال للنصيحة:** "لا توجد بيانات كافية حتى الآن."
  - **isActionable:** false

**القاعدة الأهم:** إذا لم تكن هناك رؤية واضحة أو مهمة، اجعل 'isActionable' تساوي false. هدفنا هو تقديم قيمة حقيقية، وليس مجرد ملء الفراغ. كن موجزًا ومباشرًا.`,
});

const proactiveCampaignAnalysisFlow = ai.defineFlow(
  {
    name: 'proactiveCampaignAnalysisFlow',
    inputSchema: ProactiveCampaignAnalysisInputSchema,
    outputSchema: ProactiveCampaignAnalysisOutputSchema,
  },
  async (input) => {
    // If there are fewer than 2 campaigns, there's nothing to compare.
    if (input.campaigns.length < 2) {
      return { insight: "تحتاج إلى حملتين نشطتين على الأقل للمقارنة.", isActionable: false };
    }

    const { output } = await analysisPrompt(input);
    if (!output) {
      throw new Error("Failed to generate proactive campaign analysis.");
    }
    return output;
  }
);

export async function proactiveCampaignAnalysis(
  input: ProactiveCampaignAnalysisInput
): Promise<ProactiveCampaignAnalysisOutput> {
  return proactiveCampaignAnalysisFlow(input);
}
