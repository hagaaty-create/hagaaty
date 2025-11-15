'use server';

/**
 * @fileOverview An AI agent that creates a marketing campaign for a blog post.
 *
 * - generateMarketingContent - The main function that orchestrates the campaign generation.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { collection, getDocs, orderBy, query, limit, Timestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase/server-initialization';
import type { GenerateMarketingContentOutput } from '@/types';
import { GenerateMarketingContentOutputSchema } from '@/types';
import { generateImage } from './generate-image-flow';


const getMostRecentArticle = ai.defineTool(
  {
    name: 'getMostRecentArticle',
    description: 'يسترجع أحدث مقال منشور في المدونة لاستهدافه في حملة تسويقية.',
    outputSchema: z.object({
        id: z.string(),
        title: z.string(),
        content: z.string(),
        excerpt: z.string(),
        slug: z.string(),
        date: z.string(),
    })
  },
  async () => {
    console.log('[getMostRecentArticle] Fetching the most recent article.');
    const { firestore } = initializeFirebase();
    const postsRef = collection(firestore, 'posts');
    const q = query(postsRef, orderBy('date', 'desc'), limit(1));
    const snapshot = await getDocs(q);


    if (snapshot.empty) {
      throw new Error('لا توجد مقالات في المدونة لإنشاء حملة تسويقية.');
    }

    const doc = snapshot.docs[0];
    const post = doc.data();
    
    let dateStr: string;
    if (post.date instanceof Timestamp) {
        dateStr = post.date.toDate().toISOString();
    } else {
        dateStr = post.date;
    }

    return {
        id: doc.id,
        title: post.title,
        content: post.content,
        excerpt: post.excerpt,
        slug: post.slug,
        date: dateStr,
    };
  }
);


const marketingPrompt = ai.definePrompt({
  name: 'generateMarketingContentPrompt',
  output: { schema: GenerateMarketingContentOutputSchema.omit({ imageUrl: true }) }, // The prompt itself doesn't generate the image URL
  tools: [getMostRecentArticle],
  prompt: `أنت مدير تسويق رقمي خبير ومبدع للمدونة التقنية "حاجتي للذكاء الاصطناعي". مهمتك هي إنشاء حملة تسويق محتوى صغيرة ومؤثرة.

1.  **اختر المقال**: استخدم أداة 'getMostRecentArticle' لتحديد أحدث مقال منشور في المدونة. هذا هو المقال الذي سنروج له.

2.  **حدد الاستراتيجية**: بناءً على محتوى المقال، اكتب استراتيجية موجزة من جملتين إلى ثلاث جمل باللغة العربية. اشرح لماذا هذا المقال مهم الآن وما هي الزاوية التسويقية التي ستستخدمها (مثال: "هذا المقال مهم لأن الذكاء الاصطناعي التوليدي هو حديث الساعة. سنركز على تبسيط المفهوم للجمهور العام لزيادة التفاعل.").

3.  **اكتب منشورات لوسائل التواصل الاجتماعي**:
    *   **منشور X (تويتر)**: اكتب منشورًا قصيرًا وجذابًا باللغة العربية. يجب أن يثير الفضول، ويحتوي على سؤال للجمهور، ويتضمن 3-4 وسوم (هاشتاجات) ذات صلة.

4.  **اقترح أفكارًا للصور**: قدم 3 أفكار إبداعية ومختلفة لصور أو رسومات يمكن استخدامها مع المنشورات على وسائل التواصل الاجتماعي. يجب أن تكون الأفكار بصرية ومثيرة للاهتمام.

الآن، ابدأ العمل وقم بإنشاء هذه الحملة التسويقية.`,
});


const generateMarketingContentFlow = ai.defineFlow(
  {
    name: 'generateMarketingContentFlow',
    outputSchema: GenerateMarketingContentOutputSchema,
  },
  async () => {
    console.log('[generateMarketingContentFlow] Starting marketing content generation...');
    const { output } = await marketingPrompt();
    if (!output) {
      throw new Error('Failed to generate marketing content from prompt.');
    }
    
    if (output.imageIdeas.length === 0) {
        throw new Error('No image ideas were generated.');
    }

    console.log(`[generateMarketingContentFlow] Generating image for idea: "${output.imageIdeas[0]}"`);
    const imageResult = await generateImage({ prompt: output.imageIdeas[0] });

    console.log('[generateMarketingContentFlow] Successfully generated all marketing content.');
    return {
        ...output,
        imageUrl: imageResult.imageUrl,
    };
  }
);


export async function generateMarketingContent(): Promise<GenerateMarketingContentOutput> {
  return generateMarketingContentFlow();
}
