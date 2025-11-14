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
  prompt: `اكتب مقالاً باللغة العربية للمدونة بناءً على الموضوع التالي. يجب أن يكون المقال موجهاً لجمهور في الدول العربية والخليجية، واستخدم أسلوبًا جذابًا واحترافيًا.

الموضوع: {{{prompt}}}`,
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
