'use server';
/**
 * @fileOverview A flow that categorizes and tags a blog article using AI.
 *
 * - categorizeAndTagArticle - A function that handles the categorization and tagging process.
 * - CategorizeAndTagArticleInput - The input type for the categorizeAndTagArticle function.
 * - CategorizeAndTagArticleOutput - The return type for the categorizeAndTagArticle function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CategorizeAndTagArticleInputSchema = z.object({
  articleContent: z.string().describe('The content of the blog article.'),
});
export type CategorizeAndTagArticleInput = z.infer<
  typeof CategorizeAndTagArticleInputSchema
>;

const CategorizeAndTagArticleOutputSchema = z.object({
  category: z.string().describe('The category of the article in Arabic.'),
  tags: z.array(z.string()).describe('The tags for the article in Arabic.'),
});
export type CategorizeAndTagArticleOutput = z.infer<
  typeof CategorizeAndTagArticleOutputSchema
>;

export async function categorizeAndTagArticle(
  input: CategorizeAndTagArticleInput
): Promise<CategorizeAndTagArticleOutput> {
  return categorizeAndTagArticleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'categorizeAndTagArticlePrompt',
  input: {schema: CategorizeAndTagArticleInputSchema},
  output: {schema: CategorizeAndTagArticleOutputSchema},
  prompt: `أنت مسؤول عن مدونة باللغة العربية. مهمتك هي تصنيف ووضع وسوم لمقال مدونة معين. قم بتحديد الفئة الأنسب للمقال وقدم قائمة بالوسوم ذات الصلة، كل ذلك باللغة العربية.

  محتوى المقال: {{{articleContent}}}
  `,
});

const categorizeAndTagArticleFlow = ai.defineFlow(
  {
    name: 'categorizeAndTagArticleFlow',
    inputSchema: CategorizeAndTagArticleInputSchema,
    outputSchema: CategorizeAndTagArticleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
