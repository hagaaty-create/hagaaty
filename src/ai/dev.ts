'use server';

// The dotenv import is removed as it's not needed for Vercel deployment
// and causes build failures. Environment variables are set directly in Vercel's UI.

import '@/ai/flows/generate-blog-article.ts';
import '@/ai/flows/categorize-and-tag-article.ts';
import '@/ai/flows/smart-assistant-chat.ts';
import '@/ai/flows/create-ad-campaign.ts';
import '@/ai/flows/generate-topic-suggestions.ts';
import '@/ai/flows/analyze-article-seo.ts';
import '@/ai/flows/generate-video-flow.ts';
import '@/ai/flows/generate-affiliate-material.ts';
import '@/ai/flows/verify-agency-subscription.ts';
import '@/ai/flows/verify-payment-and-credit-user.ts';
import '@/ai/flows/notify-successful-credit.ts';
import '@/ai/flows/notify-referral-bonus.ts';
import '@/ai/flows/request-withdrawal.ts';
import '@/aiflows/generate-promotional-articles.ts';
import '@/ai/flows/analyze-campaign-performance.ts';
import '@/ai/flows/analyze-downline.ts';
import '@/ai/flows/analyze-users.ts';
import '@/ai/flows/generate-audio.ts';
import '@/ai/flows/generate-image-flow.ts';
import '@/ai/flows/generate-marketing-content.ts';
import '@/ai/flows/moderate-comment.ts';
import '@/ai/flows/notify-campaign-active.ts';
import '@/ai/flows/proactive-campaign-analysis.ts';
import '@/ai/flows/send-welcome-email.ts';
import '@/ai/flows/submit-subscription-request.ts';
