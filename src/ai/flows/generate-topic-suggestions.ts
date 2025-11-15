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
  title: z.string().describe('The suggested blog post title in Arabic.'),
  reason: z.string().describe('A brief explanation in Arabic of why this topic is relevant based on user queries.'),
});

const GenerateTopicSuggestionsOutputSchema = z.object({
  suggestions: z.array(SuggestionSchema).describe('A list of 5 suggested blog post topics in Arabic.'),
});

export type GenerateTopicSuggestionsOutput = z.infer<typeof GenerateTopicSuggestionsOutputSchema>;

const getRecentQueries = ai.defineTool(
  {
    name: 'getRecentQueries',
    description: 'يسترجع أحدث استفسارات المستخدمين المقدمة إلى المساعد الذكي.',
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
  prompt: `أنت استراتيجي محتوى لمدونة "حاجتي للذكاء الاصطناعي". مهمتك هي تحليل استفسارات المستخدمين الأخيرة لتحديد الاتجاهات ونقاط الضعف ومجالات الاهتمام، ثم اقتراح 5 مواضيع جديدة لمقالات المدونة.

أولاً، استخدم أداة 'getRecentQueries' مع حد 50 للحصول على قائمة بأحدث الأسئلة التي طرحها المستخدمون.

بعد ذلك، وبناءً على هذه الاستفسارات، قم بإنشاء 5 عناوين مقالات مدونة مميزة ومقنعة باللغة العربية. لكل اقتراح، قدم سببًا موجزًا باللغة العربية يشرح سبب كونه موضوعًا جيدًا بناءً على استفسارات المستخدمين. ركز على الموضوعات التي تبدو متكررة أو لا يغطيها المحتوى الحالي بشكل جيد.`,
});

const generateTopicSuggestionsFlow = ai.defineFlow(
  {
    name: 'generateTopicSuggestionsFlow',
    outputSchema: GenerateTopicSuggestionsOutputSchema,
  },
  async () => {
    const { output } = await suggestionPrompt({limit: 50});
    return output!;
  }
);
