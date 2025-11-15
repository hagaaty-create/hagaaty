'use server';
/**
 * @fileOverview An AI flow for notifying a user that they received a referral bonus.
 *
 * - notifyReferralBonus - A function that sends an email to the user.
 * - NotifyReferralBonusInput - The input type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { sendEmail } from '@/lib/send-email';

const NotifyReferralBonusInputSchema = z.object({
  referrerEmail: z.string().email().describe("The referrer's email address."),
  newUserName: z.string().describe('The name of the new user who made a deposit.'),
  commissionAmount: z.number().describe('The commission amount earned.'),
});

export type NotifyReferralBonusInput = z.infer<typeof NotifyReferralBonusInputSchema>;

export async function notifyReferralBonus(
  input: NotifyReferralBonusInput
): Promise<void> {
  await notifyReferralBonusFlow(input);
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

const notifyReferralBonusFlow = ai.defineFlow(
  {
    name: 'notifyReferralBonusFlow',
    inputSchema: NotifyReferralBonusInputSchema,
    outputSchema: z.void(),
  },
  async (input) => {
    const subject = `💰 لقد ربحت ${input.commissionAmount}$ من برنامج الإحالة!`;
    const referralsUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard/referrals`;
    
    const html = `
      <html dir="rtl" lang="ar">
        <body style="font-family: sans-serif; text-align: right; background-color: #f4f4f4; padding: 20px;">
          <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; padding: 30px; border: 1px solid #ddd;">
            <h1 style="color: #16a34a; font-size: 24px;">تهانينا! لديك أرباح جديدة!</h1>
            <p style="color: #555; font-size: 16px; line-height: 1.6;">
              يسعدنا إعلامك بأن المستخدم <strong>${input.newUserName}</strong>، الذي قمت بدعوته، قد قام بأول عملية شحن له.
            </p>
            <p style="color: #555; font-size: 16px; line-height: 1.6;">
              نتيجة لذلك، تمت إضافة عمولة بقيمة <strong>${input.commissionAmount.toFixed(2)}$</strong> إلى رصيد أرباح الإحالة الخاص بك.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${referralsUrl}" style="background-color: #F59E0B; color: #1c1917; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                عرض أرباح الإحالة
              </a>
            </div>
            <p style="color: #777; font-size: 14px;">
              شكرًا لمساهمتك في نمو مجتمع حاجتي. استمر في دعوة أصدقائك لزيادة أرباحك!
            </p>
          </div>
        </body>
      </html>
    `;

    await ai.generate({
      prompt: `أرسل بريدًا إلكترونيًا لإعلام المستخدم (${input.referrerEmail}) بأنه حصل على عمولة إحالة.`,
      model: 'googleai/gemini-2.5-flash',
      tools: [sendEmailTool],
      toolConfig: {
          sendEmailTool: {
              to: input.referrerEmail,
              subject,
              html,
          }
      }
    });
  }
);
