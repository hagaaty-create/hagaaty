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
  productName: z.string().describe('The name of the product or service, which will be the main headline.'),
  productDescription: z.string().describe('A brief description of the product or service for the ad body.'),
  targetAudience: z.string().describe('The intended target audience for the ad.'),
  keywords: z.string().describe('Comma-separated keywords for the ad campaign.'),
  websiteUrl: z.string().url().describe('The destination website URL for the ad.'),
  adType: z.enum(['website_traffic', 'call']).describe('The primary goal of the ad campaign.'),
});

export type CreateAdCampaignInput = z.infer<typeof CreateAdCampaignInputSchema>;

const AdCopySchema = z.object({
    headline: z.string().describe('A catchy, short headline for the ad, in Arabic.'),
    body: z.string().describe('The main body text of the ad, persuasive and informative, in Arabic.'),
});

const CreateAdCampaignOutputSchema = z.object({
  suggestionA: AdCopySchema.describe('The first ad copy suggestion (Variant A).'),
  suggestionB: AdCopySchema.describe('A different, alternative ad copy suggestion (Variant B).'),
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
  prompt: `أنت خبير في كتابة الإعلانات لحملات جوجل الإعلانية باللغة العربية. مهمتك هي إنشاء نسختين إعلانيتين مختلفتين (اقتراح أ، اقتراح ب) لحملة إعلانية جديدة. يجب أن تكون كل نسخة فريدة في أسلوبها أو في الزاوية التي تتناولها لجذب شرائح مختلفة من الجمهور. يجب أن تكون النبرة احترافية، مقنعة، وجذابة للسوق العربي والخليجي.

الهدف من الحملة: {{{adType}}}
اسم المنتج/العنوان الرئيسي: {{{productName}}}
وصف المنتج: {{{productDescription}}}
الجمهور المستهدف: {{{targetAudience}}}
الكلمات الرئيسية: {{{keywords}}}
الموقع الإلكتروني: {{{websiteUrl}}}

قم بإنشاء اقتراحين إعلانيين (أ و ب)، كل منهما يحتوي على عنوان ونص أساسي. ركز على تحويل الهدف والجمهور إلى نسختين إعلانيتين فعالتين ومتميزتين.`,
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
