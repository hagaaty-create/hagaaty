'use server';

/**
 * @fileOverview AI-powered blog article generation flow.
 *
 * - generateBlogArticle - A function that generates a blog article from a prompt.
 * - GenerateBlogArticleInput - The input type for the generateBlogArticle function.
 * - GenerateBlogArticleOutput - The return type for the generateBlogArticle function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateBlogArticleInputSchema = z.object({
  prompt: z.string().describe('The prompt to generate the blog article from.'),
});

export type GenerateBlogArticleInput = z.infer<
  typeof GenerateBlogArticleInputSchema
>;

const GenerateBlogArticleOutputSchema = z.object({
  article: z.string().describe('The generated blog article.'),
});

export type GenerateBlogArticleOutput = z.infer<
  typeof GenerateBlogArticleOutputSchema
>;

export async function generateBlogArticle(
  input: GenerateBlogArticleInput
): Promise<GenerateBlogArticleOutput> {
  return generateBlogArticleFlow(input);
}

const generateBlogArticlePrompt = ai.definePrompt({
  name: 'generateBlogArticlePrompt',
  input: {schema: GenerateBlogArticleInputSchema},
  output: {schema: GenerateBlogArticleOutputSchema},
  prompt: `Generate a blog article based on the following prompt:\n\n{{{prompt}}} `,
  model: 'openrouter:google/gemma-1.1-7b-it',
  config: {
    apiKey: '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',
  },
});

const generateBlogArticleFlow = ai.defineFlow(
  {
    name: 'generateBlogArticleFlow',
    inputSchema: GenerateBlogArticleInputSchema,
    outputSchema: GenerateBlogArticleOutputSchema,
  },
  async input => {
    const {output} = await generateBlogArticlePrompt(input);
    return output!;
  }
);
