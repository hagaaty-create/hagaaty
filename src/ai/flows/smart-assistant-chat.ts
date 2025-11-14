'use server';

/**
 * @fileOverview An AI agent for a smart assistant chat interface that can answer questions based on blog content.
 *
 * - smartAssistantChat - A function that handles the smart assistant chat process.
 * - SmartAssistantChatInput - The input type for the smartAssistantChat function.
 * - SmartAssistantChatOutput - The return type for the smartAssistantChat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {getFirestore} from 'firebase-admin/firestore';
import {getApps, initializeApp, cert} from 'firebase-admin/app';
import {Post} from '@/types';

// Initialize Firebase Admin SDK if not already initialized
if (!getApps().length) {
  initializeApp();
}

const SmartAssistantChatInputSchema = z.object({
  query: z.string().describe('The user query for the smart assistant.'),
});
export type SmartAssistantChatInput = z.infer<
  typeof SmartAssistantChatInputSchema
>;

const SmartAssistantChatOutputSchema = z.object({
  response: z.string().describe('The response from the smart assistant.'),
});
export type SmartAssistantChatOutput = z.infer<
  typeof SmartAssistantChatOutputSchema
>;

const getPublishedArticles = ai.defineTool(
  {
    name: 'getPublishedArticles',
    description:
      'يسترجع قائمة بمقالات المدونة المنشورة. استخدم هذا للرد على الأسئلة المتعلقة بمحتوى المدونة.',
    inputSchema: z.object({
      keywords: z
        .array(z.string())
        .describe('الكلمات الرئيسية للبحث عنها في عناوين المقالات أو الوسوم.'),
    }),
    outputSchema: z.array(
      z.object({
        title: z.string(),
        content: z.string(),
        category: z.string(),
        tags: z.array(z.string()),
      })
    ),
  },
  async input => {
    console.log(
      `[getPublishedArticles] Searching for articles with keywords: ${input.keywords.join(', ')}`
    );
    const db = getFirestore();
    const articlesRef = db.collection('posts');
    const snapshot = await articlesRef.get();

    if (snapshot.empty) {
      return [];
    }

    let allPosts: Post[] = [];
    snapshot.forEach(doc => {
      allPosts.push({id: doc.id, ...doc.data()} as Post);
    });

    // Filter posts based on keywords (simple case-insensitive search)
    const filteredPosts = allPosts.filter(post => {
      const postContent =
        `${post.title} ${post.content} ${post.category} ${post.tags.join(' ')}`.toLowerCase();
      return input.keywords.some(keyword =>
        postContent.includes(keyword.toLowerCase())
      );
    });

    // Return a subset of fields
    return filteredPosts.map(post => ({
      title: post.title,
      content: post.content.substring(0, 500) + '...', // Truncate for context
      category: post.category,
      tags: post.tags,
    }));
  }
);

export async function smartAssistantChat(
  input: SmartAssistantChatInput
): Promise<SmartAssistantChatOutput> {
  return smartAssistantChatFlow(input);
}

const prompt = ai.definePrompt({
  name: 'smartAssistantChatPrompt',
  input: {schema: SmartAssistantChatInputSchema},
  output: {schema: SmartAssistantChatOutputSchema},
  tools: [getPublishedArticles],
  prompt: `أنت مساعد ذكي وودود لمدونة "حاجتي للذكاء الاصطناعي". هدفك هو الإجابة على أسئلة المستخدمين باللغة العربية بناءً على محتوى المدونة.

أولاً، استخدم أداة 'getPublishedArticles' للعثور على المقالات ذات الصلة بناءً على استعلام المستخدم.

بعد ذلك، استخدم محتوى المقالات التي تم استردادها لصياغة إجابة شاملة ومفيدة.

إذا لم تتمكن من العثور على مقال ذي صلة، فاذكر بأدب أنك لم تتمكن من العثور على المعلومات في المدونة ولكن يمكنك المساعدة في أسئلة أخرى. لا تخترع معلومات.

استعلام المستخدم: {{{query}}}`,
});

const smartAssistantChatFlow = ai.defineFlow(
  {
    name: 'smartAssistantChatFlow',
    inputSchema: SmartAssistantChatInputSchema,
    outputSchema: SmartAssistantChatOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
