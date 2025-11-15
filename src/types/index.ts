import { Timestamp } from 'firebase/firestore';
import { z } from 'zod';

export type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  imageHint: string;
  author: {
    name: string;
    avatarUrl: string;
  };
  date: string | Timestamp; // Allow both string and Timestamp for flexibility
  category: string;
  tags: string[];
};

export type Comment = {
    id: string;
    content: string;
    authorId: string;
    authorName: string;
    authorAvatar: string;
    createdAt: Timestamp;
};

export const SmartAssistantChatInputSchema = z.object({
  query: z.string().describe('The user query for the smart assistant.'),
});
export type SmartAssistantChatInput = z.infer<
  typeof SmartAssistantChatInputSchema
>;

export const SmartAssistantChatOutputSchema = z.object({
  response: z.string().describe('The text response from the smart assistant.'),
});
export type SmartAssistantChatOutput = z.infer<
  typeof SmartAssistantChatOutputSchema
>;

// Schema definitions for generateMarketingContent flow
const ArticleInfoSchema = z.object({
  title: z.string().describe('The title of the article.'),
  excerpt: z.string().describe('A short excerpt from the article.'),
  slug: z.string().describe('The URL slug for the article.'),
});

const SocialPostSchema = z.object({
  text: z.string().describe('The content of the social media post, in Arabic.'),
  hashtags: z.array(z.string()).describe('A list of relevant hashtags in Arabic, including the # symbol.'),
});

export const GenerateMarketingContentOutputSchema = z.object({
  article: ArticleInfoSchema,
  strategy: z.string().describe('A brief explanation in Arabic of why this article was chosen and the marketing angle.'),
  socialPosts: z.object({
    xPost: SocialPostSchema.describe('A post formatted for X (formerly Twitter).'),
  }),
  imageIdeas: z.array(z.string()).describe('A list of 3 creative and engaging image ideas for the social media posts, in Arabic.'),
  imageUrl: z.string().url().describe('URL of the generated image for the campaign.'),
});

export type GenerateMarketingContentOutput = z.infer<typeof GenerateMarketingContentOutputSchema>;
