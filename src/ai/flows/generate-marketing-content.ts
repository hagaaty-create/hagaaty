'use server';

/**
 * @fileOverview An AI agent that creates a marketing campaign for a blog post.
 *
 * - generateMarketingContent - The main function that orchestrates the campaign generation.
 * - GenerateMarketingContentOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getApps, initializeApp } from 'firebase-admin/app';
import type { Post } from '@/types';

// Initialize Firebase Admin SDK if not already initialized
if (!getApps().length) {
  initializeApp();
}

// Define Zod schemas for structured output

const ArticleInfoSchema = z.object({
  title: z.string().describe('The title of the article.'),
  excerpt: z.string().describe('A short excerpt from the article.'),
  slug: z.string().describe('The URL slug for the article.'),
});

const SocialPostSchema = z.object({
  text: z.string().describe('The content of the social media post, in Arabic.'),
  hashtags: z.array(z.string()).describe('A list of relevant hashtags in Arabic, including the # symbol.'),
});

export const GenerateMarketingContentOutputSchema = z.object({
  article: ArticleInfoSchema,
  strategy: z.string().describe('A brief explanation in Arabic of why this article was chosen and the marketing angle.'),
  socialPosts: z.object({
    xPost: SocialPostSchema.describe('A post formatted for X (formerly Twitter).'),
  }),
  imageIdeas: z.array(z.string()).describe('A list of 3 creative and engaging image ideas for the social media posts, in Arabic.'),
});

export type GenerateMarketingContentOutput = z.infer<typeof GenerateMarketingContentOutputSchema>;


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
    const db = getFirestore();
    const postsRef = db.collection('posts').orderBy('date', 'desc').limit(1);
    const snapshot = await postsRef.get();

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
  output: { schema: GenerateMarketingContentOutputSchema },
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
    console.log('[generateMarketingContentFlow] Successfully generated marketing content.');
    return output;
  }
);


export async function generateMarketingContent(): Promise<GenerateMarketingContentOutput> {
  return generateMarketingContentFlow();
}
