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
  prompt: `You are an expert advertising copywriter. Your task is to generate a compelling ad campaign for the following product. Create a catchy headline and a persuasive body text. The tone should be professional and enticing.

Product Name: {{{productName}}}
Product Description: {{{productDescription}}}
Target Audience: {{{targetAudience}}}

Generate the ad copy now.`,
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
