'use server';

/**
 * @fileOverview An AI flow for generating blog topic suggestions based on user queries.
 *
 * - generateTopicSuggestions - Analyzes user queries and suggests new blog topics.
 * - GenerateTopicSuggestionsOutput - The return type for the generateTopicSuggestions function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getFirestore } from 'firebase-admin/firestore';
import { getApps, initializeApp } from 'firebase-admin/app';

// Initialize Firebase Admin SDK if not already initialized
if (!getApps().length) {
  initializeApp();
}

const SuggestionSchema = z.object({
  title: z.string().describe('The suggested blog post title.'),
  reason: z.string().describe('A brief explanation of why this topic is relevant based on user queries.'),
});

const GenerateTopicSuggestionsOutputSchema = z.object({
  suggestions: z.array(SuggestionSchema).describe('A list of 5 suggested blog post topics.'),
});

export type GenerateTopicSuggestionsOutput = z.infer<typeof GenerateTopicSuggestionsOutputSchema>;

const getRecentQueries = ai.defineTool(
  {
    name: 'getRecentQueries',
    description: 'Retrieves the most recent user queries submitted to the smart assistant.',
    inputSchema: z.object({
        limit: z.number().optional().default(50).describe('The maximum number of queries to retrieve.'),
    }),
    outputSchema: z.array(z.string().describe('A list of user queries.')),
  },
  async ({ limit }) => {
    console.log(`[getRecentQueries] Fetching the last ${limit} user queries.`);
    const db = getFirestore();
    const queriesRef = db.collection('queries').orderBy('createdAt', 'desc').limit(limit);
    const snapshot = await queriesRef.get();

    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map(doc => doc.data().query);
  }
);


export async function generateTopicSuggestions(): Promise<GenerateTopicSuggestionsOutput> {
  return generateTopicSuggestionsFlow();
}

const suggestionPrompt = ai.definePrompt({
  name: 'generateTopicSuggestionsPrompt',
  output: { schema: GenerateTopicSuggestionsOutputSchema },
  tools: [getRecentQueries],
  prompt: `You are a content strategist for the Hagaaty AI Blog. Your task is to analyze recent user queries to identify trends, pain points, and areas of interest, and then suggest 5 new blog post topics.

First, use the 'getRecentQueries' tool to get a list of the latest questions users have asked.

Then, based on these queries, generate 5 distinct and compelling blog post titles. For each suggestion, provide a short reason explaining why it's a good topic based on the user queries. Focus on topics that seem to be recurring or are not well-covered by existing content.`,
});

const generateTopicSuggestionsFlow = ai.defineFlow(
  {
    name: 'generateTopicSuggestionsFlow',
    outputSchema: GenerateTopicSuggestionsOutputSchema,
  },
  async () => {
    const { output } = await suggestionPrompt();
    return output!;
  }
);
