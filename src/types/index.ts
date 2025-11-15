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
