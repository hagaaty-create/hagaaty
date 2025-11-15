'use server';

import { config } from 'dotenv';
config();

import '@/ai/flows/generate-blog-article.ts';
import '@/ai/flows/categorize-and-tag-article.ts';
import '@/ai/flows/smart-assistant-chat.ts';
import '@/ai/flows/create-ad-campaign.ts';
import '@/ai/flows/generate-topic-suggestions.ts';
import '@/ai/flows/generate-image-flow.ts';
import '@/ai/flows/generate-marketing-content.ts';
import '@/ai/flows/submit-subscription-request.ts';
import '@/ai/flows/notify-campaign-active.ts';
import '@/ai/flows/send-welcome-email.ts';
import '@/ai/flows/verify-payment-and-credit-user.ts';
import '@/ai/flows/notify-referral-bonus.ts';
import '@/ai chewy/flows/notify-successful-credit.ts';
import '@/ai/flows/generate-promotional-articles.ts';
import '@/ai/flows/analyze-downline.ts';
import '@/ai/flows/request-withdrawal.ts';
import '@/ai/flows/verify-agency-subscription.ts';
import '@/ai/flows/generate-affiliate-material.ts';
import '@/ai/flows/analyze-campaign-performance.ts';
import '@/ai/flows/analyze-users.ts';

    