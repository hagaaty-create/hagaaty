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
  category: z.string().describe('The category of the article.'),
  tags: z.array(z.string()).describe('The tags for the article.'),
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
  prompt: `You are a blog administrator. Your task is to categorize and tag a given blog article.

  Article Content: {{{articleContent}}}
  
  Determine the most appropriate category for the article and provide a list of relevant tags.
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
