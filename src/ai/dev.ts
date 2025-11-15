'use server';

import { config } from 'dotenv';
config();

import '@/ai/flows/generate-blog-article.ts';
import '@/ai/flows/categorize-and-tag-article.ts';
import '@/ai/flows/smart-assistant-chat.ts';
import '@/ai/flows/create-ad-campaign.ts';
import '@/ai/flows/generate-topic-suggestions.ts';
    
