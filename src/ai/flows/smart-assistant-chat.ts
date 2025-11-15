'use server';

/**
 * @fileOverview An AI agent for a smart assistant chat interface that can answer questions
 * by searching the blog content.
 *
 * - smartAssistantChat - A function that handles the smart assistant chat process.
 * - SmartAssistantChatInput - The input type for the smartAssistantChat function.
 * - SmartAssistantChatOutput - The return type for the smartAssistantChat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {getFirestore, Timestamp} from 'firebase-admin/firestore';
import {getApps, initializeApp} from 'firebase-admin/app';
import {
  SmartAssistantChatInputSchema,
  type SmartAssistantChatInput,
  SmartAssistantChatOutputSchema,
  type SmartAssistantChatOutput,
} from '@/types';
import {collection, query, where, getDocs, limit} from 'firebase/firestore';

// Initialize Firebase Admin SDK if not already initialized
if (!getApps().length) {
  initializeApp();
}
const db = getFirestore();

const searchBlogTool = ai.defineTool(
  {
    name: 'searchBlogTool',
    description:
      'Search the blog for articles relevant to the user\'s query.',
    inputSchema: z.object({
      query: z.string(),
    }),
    outputSchema: z.array(
      z.object({
        title: z.string(),
        excerpt: z.string(),
        slug: z.string(),
      })
    ),
  },
  async input => {
    console.log(`[Tool] Searching blog for query: "${input.query}"`);
    // This is a simplified search. A real-world app would use a more robust
    // search solution like Algolia or a vector database.
    const postsRef = db.collection('posts');
    const snapshot = await postsRef.get();

    if (snapshot.empty) {
      return [];
    }

    const allPosts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Simple keyword matching in title and content
    const keywords = input.query.split(/\s+/).filter(k => k.length > 2); // ignore short words
    const relevantPosts = allPosts
      .map(post => {
        let score = 0;
        const content = `${post.title} ${post.content}`;
        for (const keyword of keywords) {
          if (content.toLowerCase().includes(keyword.toLowerCase())) {
            score++;
          }
        }
        return {post, score};
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3) // Return top 3 matches
      .map(item => ({
        title: item.post.title,
        excerpt: item.post.excerpt,
        slug: item.post.slug,
      }));

    console.log(`[Tool] Found ${relevantPosts.length} relevant articles.`);
    return relevantPosts;
  }
);

const chatPrompt = ai.definePrompt({
  name: 'smartAssistantPrompt',
  tools: [searchBlogTool],
  prompt: `أنت مساعد ذكي لمنصة "حاجتي للذكاء الاصطناعي"، وهي منصة تسويق وإعلانات. اسمك "ذكي".

مهمتك هي الإجابة على أسئلة المستخدمين بطريقة ودودة ومفيدة باللغة العربية.

عندما يسألك المستخدم سؤالاً، اتبع الخطوات التالية:
1.  **ابحث أولاً في المدونة**: استخدم أداة "searchBlogTool" للبحث عن مقالات ذات صلة بسؤال المستخدم.
2.  **إذا وجدت نتائج**:
    *   قم بصياغة إجابة شاملة بناءً على المعلومات الموجودة في المقالات.
    *   **مهم جدًا**: في نهاية إجابتك، أضف قسمًا بعنوان "📚 مقالات ذات صلة:" وأدرج روابط للمقالات التي استخدمتها. استخدم تنسيق Markdown للروابط بهذا الشكل: \`[عنوان المقال](/articles/slug-المقال)\`.
3.  **إذا لم تجد نتائج**: أجب على السؤال بأفضل ما لديك من معلوماتك العامة، ولكن حاول دائمًا ربط الإجابة بمواضيع التسويق الرقمي أو الذكاء الاصطناعي أو الإعلانات إن أمكن.

كن دائمًا إيجابيًا ومحترفًا.

استعلام المستخدم: {{{query}}}`,
});

export async function smartAssistantChat(
  input: SmartAssistantChatInput
): Promise<SmartAssistantChatOutput> {
  const result = await chatPrompt(input);

  return {response: result.text};
}
