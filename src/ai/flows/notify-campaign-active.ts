'use server';
/**
 * @fileOverview An AI flow for notifying a user that their ad campaign is active.
 *
 * - notifyCampaignActive - A function that sends an email to the user.
 * - NotifyCampaignActiveInput - The input type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { sendEmail } from '@/lib/send-email';

const NotifyCampaignActiveInputSchema = z.object({
  userEmail: z.string().email().describe("The user's email address."),
  campaignName: z.string().describe('The name of the activated campaign.'),
  campaignId: z.string().describe('The ID of the campaign to link to.'),
});

export type NotifyCampaignActiveInput = z.infer<typeof NotifyCampaignActiveInputSchema>;

export async function notifyCampaignActive(
  input: NotifyCampaignActiveInput
): Promise<void> {
  await notifyCampaignActiveFlow(input);
}

const sendEmailTool = ai.defineTool(
  {
    name: 'sendEmailTool',
    description: 'Sends an email.',
    inputSchema: z.object({
      to: z.string(),
      subject: z.string(),
      html: z.string(),
    }),
    outputSchema: z.void(),
  },
  async ({ to, subject, html }) => {
    await sendEmail({ to, subject, html });
  }
);

const notifyCampaignActiveFlow = ai.defineFlow(
  {
    name: 'notifyCampaignActiveFlow',
    inputSchema: NotifyCampaignActiveInputSchema,
    outputSchema: z.void(),
  },
  async (input) => {
    const subject = `🚀 حملتك الإعلانية "${input.campaignName}" أصبحت نشطة الآن!`;
    const campaignUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard/campaigns`;
    
    const html = `
      <html dir="rtl" lang="ar">
        <body style="font-family: sans-serif; text-align: right; background-color: #f4f4f4; padding: 20px;">
          <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; padding: 30px; border: 1px solid #ddd;">
            <h1 style="color: #333; font-size: 24px;">تهانينا!</h1>
            <p style="color: #555; font-size: 16px; line-height: 1.6;">
              يسعدنا إخبارك بأنه قد تمت مراجعة حملتك الإعلانية <strong>"${input.campaignName}"</strong> والموافقة عليها.
            </p>
            <p style="color: #555; font-size: 16px; line-height: 1.6;">
              الحملة الآن نشطة وبدأت في الظهور للجمهور المستهدف. يمكنك متابعة أدائها وتحليلاتها مباشرة من لوحة التحكم الخاصة بك.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${campaignUrl}" style="background-color: #F59E0B; color: #1c1917; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                عرض حملاتي
              </a>
            </div>
            <p style="color: #777; font-size: 14px;">
              شكرًا لاستخدامك منصة حاجتي للذكاء الاصطناعي.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin-top: 20px;" />
            <p style="font-size: 12px; color: #999; text-align: center;">
              إذا كانت لديك أي أسئلة، فلا تتردد في التواصل مع فريق الدعم.
            </p>
          </div>
        </body>
      </html>
    `;

    // Updated prompt to force tool call correctly
    await ai.prompt(
      `أرسل بريدًا إلكترونيًا إلى ${input.userEmail} لإعلامه بأن حملته الإعلانية "${input.campaignName}" أصبحت نشطة الآن. استخدم أداة إرسال البريد الإلكتروني.
       
       الموضوع: ${subject}
       المحتوى:
       ${html}
      `, {
      tools: [sendEmailTool],
    });
  }
);
