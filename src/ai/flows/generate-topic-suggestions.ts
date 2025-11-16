
'use server';

/**
 * @fileOverview An AI flow for generating blog topic suggestions based on user queries and existing content.
 *
 * - generateTopicSuggestions - Analyzes user queries, compares them against existing articles, and suggests new blog topics to fill content gaps.
 * - GenerateTopicSuggestionsOutput - The return type for the generateTopicSuggestions function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { collection, getDocs, limit, orderBy, query, Timestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase/server-initialization';
import type { Post } from '@/types';


const SuggestionSchema = z.object({
  title: z.string().describe('The suggested blog post title in Arabic.'),
  reason: z.string().describe('A brief explanation in Arabic of why this topic is a good content gap to fill based on user queries and existing articles.'),
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
  async ({ limit: queryLimit }) => {
    console.log(`[getRecentQueries] Fetching the last ${queryLimit} user queries.`);
    const { firestore } = initializeFirebase();
    const queriesRef = collection(firestore, 'queries');
    const q = query(queriesRef, orderBy('createdAt', 'desc'), limit(queryLimit));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map(doc => doc.data().query);
  }
);

const getRecentArticles = ai.defineTool(
    {
        name: 'getRecentArticles',
        description: 'يسترجع أحدث المقالات المنشورة في المدونة لتحليل المحتوى الحالي.',
        inputSchema: z.object({
            limit: z.number().optional().default(20).describe('The maximum number of articles to retrieve.'),
        }),
        outputSchema: z.array(z.object({
            title: z.string(),
            excerpt: z.string(),
        })),
    },
    async ({ limit: queryLimit }) => {
        console.log(`[getRecentArticles] Fetching the last ${queryLimit} articles.`);
        const { firestore } = initializeFirebase();
        const postsRef = collection(firestore, 'posts');
        const q = query(postsRef, orderBy('date', 'desc'), limit(queryLimit));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return [];
        }

        return snapshot.docs.map(doc => {
            const data = doc.data() as Post;
            return {
                title: data.title,
                excerpt: data.excerpt,
            };
        });
    }
);


export async function generateTopicSuggestions(): Promise<GenerateTopicSuggestionsOutput> {
  return generateTopicSuggestionsFlow();
}

const suggestionPrompt = ai.definePrompt({
  name: 'generateTopicSuggestionsPrompt',
  output: { schema: GenerateTopicSuggestionsOutputSchema },
  tools: [getRecentQueries, getRecentArticles],
  prompt: `أنت استراتيجي محتوى خبير في تحسين محركات البحث (SEO) لمدونة "حاجتي للذكاء الاصطناعي". مهمتك هي إجراء تحليل للفجوات في المحتوى (Content Gap Analysis) واقتراح 5 مواضيع جديدة للمقالات.

1.  **احصل على بيانات المستخدم**: استخدم أداة 'getRecentQueries' مع حد 50 للحصول على قائمة بأحدث الأسئلة التي طرحها المستخدمون. هذه هي الموضوعات التي يهتم بها جمهورك.

2.  **احصل على المحتوى الحالي**: استخدم أداة 'getRecentArticles' مع حد 20 للحصول على قائمة بأحدث المقالات الموجودة بالفعل في المدونة.

3.  **حلل وابحث عن الفجوات**: قارن بين استفسارات المستخدمين والمقالات الحالية. هدفك هو العثور على الأسئلة أو الموضوعات التي يطرحها المستخدمون بشكل متكرر ولكن لا يتم تناولها بشكل مباشر أو كافٍ في المحتوى الحالي.

4.  **اقترح مواضيع لسد الفجوات**: بناءً على تحليلك، قم بإنشاء 5 عناوين مقالات جديدة ومقنعة باللغة العربية. لكل اقتراح، قدم "سببًا" موجزًا باللغة العربية يشرح لماذا يعتبر هذا الموضوع فجوة مهمة في المحتوى يجب سدها وكيف يلبي طلبًا حقيقيًا من المستخدمين. ركز على العناوين التي لديها القدرة على التفوق في نتائج البحث.`,
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
