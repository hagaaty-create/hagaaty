'use server';

/**
 * @fileoverview An AI agent that generates a batch of promotional blog articles about the platform's features.
 *
 * - generatePromotionalArticles - The main function that orchestrates the article generation process.
 * - generateAndSaveArticleFlow - A flow to generate and save a single article.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { generateBlogArticle } from './generate-blog-article';
import { categorizeAndTagArticle } from './categorize-and-tag-article';
import { generateImage } from './generate-image-flow';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getApps, initializeApp } from 'firebase-admin/app';


// Initialize Firebase Admin SDK if not already initialized
// This is needed for server-side operations in flows.
if (!getApps().length) {
  initializeApp();
}

const db = getFirestore();

const ArticleTopicSchema = z.object({
  title: z.string().describe('A catchy, SEO-friendly blog post title in Arabic about a specific feature of the Hagaaty AI platform.'),
  prompt: z.string().describe('A detailed prompt in Arabic for the AI to write the article based on the title.'),
});
export type ArticleTopic = z.infer<typeof ArticleTopicSchema>;

const ArticleTopicsOutputSchema = z.object({
  topics: z.array(ArticleTopicSchema).length(5).describe('A list of exactly 5 unique article topics.'),
});

const getArticleTopicsPrompt = ai.definePrompt({
    name: 'getPromotionalArticleTopics',
    output: { schema: ArticleTopicsOutputSchema },
    prompt: `أنت خبير في تسويق المحتوى لمنصة تسمى "حاجتي للذكاء الاصطناعي". مهمتك هي إنشاء 5 مواضيع مقالات فريدة وجذابة باللغة العربية للترويج لمميزات المنصة.

المميزات الرئيسية للمنصة هي:
1.  **نظام إعلانات جوجل الفوري**: يحصل المستخدم على رصيد ترحيبي 2$، ويقوم الذكاء الاصطناعي بتصميم وتفعيل حملة خلال 10 دقائق.
2.  **برنامج الإحالة الشبكي (MLM)**: يكسب المستخدمون عمولات من 5 مستويات في شبكتهم. يتم توزيع 10% من كل إيداع على الشبكة (50% للمستوى 1, 25% للثاني, 12.5% للثالث, 6.25% للرابع, 6.25% للخامس).
3.  **وكيل تحليل فجوات المحتوى (SEO)**: يحلل استفسارات المستخدمين ويقترح مواضيع جديدة للمدونة.
4.  **مولد الصور بالذكاء الاصطناعي**: لتوليد صور فريدة للمقالات ومنشورات التواصل الاجتماعي.
5.  **نظام النقاط والمكافآت**: يكسب المستخدمون نقاطًا عند تشغيل الوكيل المستقل، ويحصلون على رصيد إعلاني كمكافأة.
6.  **وكالة حاجتي الإعلانية**: خدمة اشتراك سنوي تمنح حسابات إعلانية موثقة على جوجل، تيك توك، إلخ.

لكل موضوع من المواضيع الخمسة، قم بإنشاء:
- **title**: عنوان مقال جذاب ومناسب لمحركات البحث باللغة العربية.
- **prompt**: موجه (prompt) تفصيلي باللغة العربية للذكاء الاصطناعي لكتابة المقال، يشرح فيه كيفية تناول الموضوع والتركيز على فوائده للمستخدم (المسوقين، أصحاب الأعمال).

يجب أن يكون كل موضوع فريدًا ويركز على زاوية تسويقية مختلفة. ركز على جذب المسوقين الشبكيين وأصحاب الأعمال.`,
});


const saveArticleTool = ai.defineTool(
    {
        name: 'saveArticleTool',
        description: 'Saves a fully generated article to the Firestore database.',
        inputSchema: z.object({
            title: z.string(),
            content: z.string(),
            category: z.string(),
            tags: z.array(z.string()),
            imageUrl: z.string(),
            imageHint: z.string(),
        }),
        outputSchema: z.void(),
    },
    async (articleData) => {
        console.log(`[Tool:saveArticle] Saving article: ${articleData.title}`);
        
        const slug = articleData.title.toLowerCase().replace(/[^a-z0-9\u0621-\u064A]+/g, '-').replace(/(^-|-$)/g, '');

        const newArticle = {
            ...articleData,
            slug,
            excerpt: articleData.content.substring(0, 150) + '...',
            author: { // Generic author for automated posts
                name: "فريق حاجتي",
                avatarUrl: 'https://picsum.photos/seed/hagaaty-logo/40/40'
            },
            date: Timestamp.now(), // Use Admin SDK's Timestamp
            content: articleData.content, // ensure content is passed
        };

        const postsCollection = db.collection('posts');
        await postsCollection.add(newArticle);
        console.log(`[Tool:saveArticle] Successfully saved article: ${articleData.title}`);
    }
);



export const generateAndSaveArticleFlow = ai.defineFlow(
    {
        name: 'generateAndSaveSingleArticle',
        inputSchema: ArticleTopicSchema,
        outputSchema: z.void(),
    },
    async (topic) => {
        console.log(`[Sub-Flow] Start generation for: ${topic.title}`);
        
        // 1. Generate Article Content
        const articleResult = await generateBlogArticle({ prompt: topic.prompt });
        const content = articleResult.article;

        // 2. Generate Metadata
        const metaResult = await categorizeAndTagArticle({ articleContent: content });

        // 3. Generate Image
        const imageResult = await generateImage({ prompt: topic.title });

        // 4. Save to Firestore using the tool
        await saveArticleTool({
            title: topic.title,
            content: content,
            category: metaResult.category,
            tags: metaResult.tags,
            imageUrl: imageResult.imageUrl,
            imageHint: imageResult.imageHint,
        });

         console.log(`[Sub-Flow] Finished generation for: ${topic.title}`);
    }
);


const generatePromotionalArticlesFlow = ai.defineFlow(
  {
    name: 'generatePromotionalArticlesFlow',
    outputSchema: z.object({
      generatedCount: z.number(),
      generatedTitles: z.array(z.string()),
    }),
  },
  async () => {
    console.log('[Flow] Starting generation of 5 promotional articles.');
    
    // 1. Get 5 promotional topics from the LLM
    const { output } = await getArticleTopicsPrompt();
    if (!output || output.topics.length === 0) {
        throw new Error('Failed to generate promotional topics.');
    }
    const topics = output.topics;
    
    console.log(`[Flow] Generated ${topics.length} topics. Starting individual article generation...`);

    // 2. For each topic, trigger the generation and saving flow in parallel.
    // We don't need to wait for them to finish, as they run in the background.
    const generationPromises = topics.map(topic => generateAndSaveArticleFlow(topic));
    
    // While we don't block the user, for this specific batch operation, 
    // we'll wait for all to complete to return a final status.
    await Promise.all(generationPromises);

    console.log('[Flow] All 5 promotional articles have been generated and saved.');
    
    return {
      generatedCount: topics.length,
      generatedTitles: topics.map(t => t.title),
    };
  }
);


export async function generatePromotionalArticles(): Promise<{ generatedCount: number, generatedTitles: string[] }> {
  // This is a fire-and-forget call from the client's perspective, 
  // but we return the promise for server-side usage or potential future waiting.
  return generatePromotionalArticlesFlow();
}
