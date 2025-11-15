'use server';

/**
 * @fileOverview An AI agent that creates marketing materials for affiliate marketers.
 *
 * - generateAffiliateMaterial - The main function that orchestrates the content generation.
 * - GenerateAffiliateMaterialInput - The input type for the function.
 * - GenerateAffiliateMaterialOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { generateImage } from './generate-image-flow';
import { generateVideo } from './generate-video-flow';

// Define Zod schemas for structured input and output

const GenerateAffiliateMaterialInputSchema = z.object({
  referralLink: z.string().url().describe("The affiliate's personal referral link."),
});
export type GenerateAffiliateMaterialInput = z.infer<typeof GenerateAffiliateMaterialInputSchema>;


export const GenerateAffiliateMaterialOutputSchema = z.object({
  strategy: z.string().describe('A brief explanation in Arabic of the marketing angle for this campaign.'),
  xPost: z.string().describe('A short, catchy post for X (formerly Twitter) in Arabic, including hashtags and a call to action.'),
  facebookPost: z.string().describe('A more detailed and engaging post for Facebook or Instagram in Arabic, focusing on benefits and storytelling.'),
  directMessage: z.string().describe('A friendly, persuasive direct message (for WhatsApp or DM) in Arabic to send to potential leads.'),
  imageIdea: z.string().describe('A creative idea for an image to accompany the social media posts.'),
  imageUrl: z.string().url().describe('URL of the generated image for the campaign.'),
  videoIdea: z.string().describe('A creative idea for a short video (Reel/Short) to accompany the social media posts.'),
  videoUrl: z.string().url().describe('URL of the generated video for the campaign.'),
});

export type GenerateAffiliateMaterialOutput = z.infer<typeof GenerateAffiliateMaterialOutputSchema>;


const marketingPrompt = ai.definePrompt({
  name: 'generateAffiliateMaterialPrompt',
  input: { schema: GenerateAffiliateMaterialInputSchema },
  output: { schema: GenerateAffiliateMaterialOutputSchema.omit({ imageUrl: true, videoUrl: true }) }, // The prompt itself doesn't generate the media URLs
  prompt: `أنت خبير في التسويق الشبكي ومبدع محتوى للمنصة التقنية "حاجتي للذكاء الاصطناعي". مهمتك هي تزويد المسوق بمجموعة متكاملة من المواد التسويقية الجاهزة لمساعدته على جذب عملاء جدد ومسوقين آخرين لشبكته.

المميزات الرئيسية للمنصة التي يجب التركيز عليها:
1.  **محاكي إعلانات جوجل**: يحصل المستخدم على 2$ رصيد ترحيبي، ويقوم الذكاء الاصطناعي بتصميم وتفعيل حملة خلال 10 دقائق.
2.  **برنامج الإحالة الشبكي (MLM)**: يكسب المسوقون عمولات من 5 مستويات عند قيام أي شخص في شبكتهم بشحن رصيده.
3.  **وكيل التسويق المستقل**: يمكن للمستخدمين كسب نقاط ومكافآت (رصيد إعلاني) بمجرد تشغيل وكيل الذكاء الاصطناعي للمساهمة في تحسين محتوى الموقع.

رابط الإحالة الخاص بالمسوق هو: {{{referralLink}}}

**مهمتك**:
1.  **ضع الاستراتيجية**: اشرح في جملتين باللغة العربية الزاوية التسويقية لهذه الحملة. هل ستركز على سهولة البدء؟ أم فرصة الربح؟
2.  **اكتب منشور X (تويتر)**: منشور قصير ومثير للفضول، يحتوي على سؤال ووسوم (هاشتاجات) ذات صلة، ويدعو المستخدمين للتسجيل عبر رابط الإحالة.
3.  **اكتب منشور فيسبوك/انستغرام**: منشور أكثر تفصيلاً، قد يحكي قصة قصيرة عن "محمد" الذي بدأ بدون خبرة وحقق أول ربح له، مع التركيز على الفوائد والدعوة للانضمام.
4.  **اكتب رسالة مباشرة (DM/WhatsApp)**: رسالة ودية وشخصية يمكن للمسوق إرسالها لأصدقائه أو للمهتمين، تشرح الفرصة وتدعوهم للبدء.
5.  **اقترح فكرة صورة**: صف فكرة صورة جذابة ومبتكرة بصريًا تلخص إحدى ميزات المنصة (مثال: "شخص يضغط زرًا على هاتفه وتنمو شجرة من المال").
6.  **اقترح فكرة فيديو**: صف فكرة فيديو قصير (10-15 ثانية) ومناسب لـ Reels/Shorts، يكون جذابًا بصريًا ويشرح ميزة واحدة بسرعة. (مثال: "لقطات سريعة لشخص يبدو محبطًا من الإعلانات، ثم يضغط على زر في منصة حاجتي، وتظهر ابتسامة على وجهه مع ظهور أيقونات دولارات").

تأكد من أن جميع النصوص تتضمن دعوة واضحة للمستخدم للتسجيل باستخدام رابط الإحالة الخاص به.`,
});


const generateAffiliateMaterialFlow = ai.defineFlow(
  {
    name: 'generateAffiliateMaterialFlow',
    inputSchema: GenerateAffiliateMaterialInputSchema,
    outputSchema: GenerateAffiliateMaterialOutputSchema,
  },
  async (input) => {
    console.log('[generateAffiliateMaterialFlow] Starting affiliate content generation...');
    const { output } = await marketingPrompt(input);
    if (!output) {
      throw new Error('Failed to generate affiliate content from prompt.');
    }
    
    if (!output.imageIdea || !output.videoIdea) {
        throw new Error('Image or video idea was not generated.');
    }

    console.log(`[generateAffiliateMaterialFlow] Generating image for idea: "${output.imageIdea}"`);
    console.log(`[generateAffiliateMaterialFlow] Generating video for idea: "${output.videoIdea}"`);

    // Run image and video generation in parallel to save time
    const [imageResult, videoResult] = await Promise.all([
        generateImage({ prompt: output.imageIdea }),
        generateVideo({ prompt: output.videoIdea })
    ]);

    console.log('[generateAffiliateMaterialFlow] Successfully generated all affiliate marketing content.');
    return {
        ...output,
        imageUrl: imageResult.imageUrl,
        videoUrl: videoResult.videoUrl,
    };
  }
);


export async function generateAffiliateMaterial(input: GenerateAffiliateMaterialInput): Promise<GenerateAffiliateMaterialOutput> {
  return generateAffiliateMaterialFlow(input);
}
