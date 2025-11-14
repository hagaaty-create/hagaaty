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
      'Retrieves a list of published blog articles. Use this to answer questions about blog content.',
    inputSchema: z.object({
      keywords: z
        .array(z.string())
        .describe('Keywords to search for in article titles or tags.'),
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
  prompt: `You are a friendly and helpful smart assistant for the Hagaaty AI Blog. Your goal is to answer user questions based on the content of the blog.

First, use the 'getPublishedArticles' tool to find relevant articles based on the user's query.

Then, use the content of the retrieved articles to formulate a comprehensive and helpful answer.

If you can't find a relevant article, politely state that you couldn't find the information in the blog but you can help with other questions. Do not make up information.

User Query: {{{query}}}`,
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
