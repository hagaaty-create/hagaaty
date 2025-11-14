'use server';

/**
 * @fileOverview An AI flow for generating ad campaign copy.
 *
 * - createAdCampaign - Generates a headline and body for an ad campaign.
 * - CreateAdCampaignInput - The input type for the createAdCampaign function.
 * - CreateAdCampaignOutput - The return type for the createAdCampaign function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CreateAdCampaignInputSchema = z.object({
  productName: z.string().describe('The name of the product or service.'),
  productDescription: z.string().describe('A brief description of the product or service.'),
  targetAudience: z.string().describe('The intended target audience for the ad.'),
});

export type CreateAdCampaignInput = z.infer<typeof CreateAdCampaignInputSchema>;

const CreateAdCampaignOutputSchema = z.object({
  headline: z.string().describe('A catchy, short headline for the ad.'),
  body: z.string().describe('The main body text of the ad, persuasive and informative.'),
});

export type CreateAdCampaignOutput = z.infer<typeof CreateAdCampaignOutputSchema>;

export async function createAdCampaign(
  input: CreateAdCampaignInput
): Promise<CreateAdCampaignOutput> {
  return createAdCampaignFlow(input);
}

const adCampaignPrompt = ai.definePrompt({
  name: 'createAdCampaignPrompt',
  input: {schema: CreateAdCampaignInputSchema},
  output: {schema: CreateAdCampaignOutputSchema},
  prompt: `أنت خبير في كتابة الإعلانات باللغة العربية. مهمتك هي إنشاء حملة إعلانية جذابة للمنتج التالي. قم بإنشاء عنوان جذاب ونص مقنع. يجب أن تكون النبرة احترافية وجذابة وموجهة للسوق العربي والخليجي.

اسم المنتج: {{{productName}}}
وصف المنتج: {{{productDescription}}}
الجمهور المستهدف: {{{targetAudience}}}

أنشئ نسخة الإعلان الآن باللغة العربية.`,
});

const createAdCampaignFlow = ai.defineFlow(
  {
    name: 'createAdCampaignFlow',
    inputSchema: CreateAdCampaignInputSchema,
    outputSchema: CreateAdCampaignOutputSchema,
  },
  async input => {
    const {output} = await adCampaignPrompt(input);
    return output!;
  }
);
