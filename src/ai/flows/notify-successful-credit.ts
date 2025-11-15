'use server';
/**
 * @fileOverview An AI flow for notifying a user that their balance has been credited.
 *
 * - notifySuccessfulCredit - A function that sends an email to the user.
 * - NotifySuccessfulCreditInput - The input type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { sendEmail } from '@/lib/send-email';

const NotifySuccessfulCreditInputSchema = z.object({
  userEmail: z.string().email().describe("The user's email address."),
  amount: z.number().describe('The amount credited to the user.'),
});

export type NotifySuccessfulCreditInput = z.infer<typeof NotifySuccessfulCreditInputSchema>;

export async function notifySuccessfulCredit(
  input: NotifySuccessfulCreditInput
): Promise<void> {
  await notifySuccessfulCreditFlow(input);
}

const sendEmailTool = ai.defineTool(
  {
    name: 'sendEmailTool',
    description: 'Sends an email.',
    inputSchema: z.object({
      to: z.string(),
      subject: z.string(),
      html: z
        .string()
        .describe('The HTML content of the email, which must be in Arabic and right-to-left (RTL).'),
    }),
    outputSchema: z.void(),
  },
  async ({ to, subject, html }) => {
    await sendEmail({ to, subject, html });
  }
);

const notifySuccessfulCreditFlow = ai.defineFlow(
  {
    name: 'notifySuccessfulCreditFlow',
    inputSchema: NotifySuccessfulCreditInputSchema,
    outputSchema: z.void(),
  },
  async (input) => {
    const subject = `✅ تم شحن رصيدك بنجاح: ${input.amount.toFixed(2)}$`;
    const createAdUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard/create-ad`;
    const billingUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard/billing`;

    const html = `
      <html dir="rtl" lang="ar">
        <body style="font-family: sans-serif; text-align: right; background-color: #f4f4f4; padding: 20px;">
          <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; padding: 30px; border: 1px solid #ddd;">
            <h1 style="color: #333; font-size: 24px;">تمت العملية بنجاح!</h1>
            <p style="color: #555; font-size: 16px; line-height: 1.6;">
              يسعدنا إخبارك بأنه قد تم التحقق من عملية الدفع الخاصة بك وإضافة مبلغ <strong>${input.amount.toFixed(2)}$</strong> إلى رصيدك الإعلاني بنجاح.
            </p>
             <p style="color: #555; font-size: 16px; line-height: 1.6;">
              أنت الآن جاهز لإطلاق حملاتك الإعلانية القوية والوصول إلى جمهورك المستهدف.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${createAdUrl}" style="background-color: #F59E0B; color: #1c1917; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                أنشئ حملتك الإعلانية الآن
              </a>
            </div>
            <p style="color: #777; font-size: 14px;">
              إذا كنت ترغب في إضافة المزيد من الرصيد، يمكنك زيارة <a href="${billingUrl}" style="color: #F59E0B; text-decoration: none;">صفحة شحن الرصيد</a> في أي وقت.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin-top: 20px;" />
            <p style="font-size: 12px; color: #999; text-align: center;">
              شكرًا لثقتك في منصة حاجتي للذكاء الاصطناعي.
            </p>
          </div>
        </body>
      </html>
    `;

    // Fire and forget
    ai.generate({
      prompt: `أرسل بريدًا إلكترونيًا لإعلام المستخدم (${input.userEmail}) بأنه تم إضافة رصيد إلى حسابه بنجاح.`,
      model: 'googleai/gemini-2.5-flash',
      tools: [sendEmailTool],
      toolConfig: {
        sendEmailTool: {
          to: input.userEmail,
          subject,
          html,
        },
      },
    }).catch(console.error);
  }
);
