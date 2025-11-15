'use server';
/**
 * @fileOverview An AI flow for processing a user's withdrawal request and notifying the admin.
 *
 * - requestWithdrawal - A function that sends an email to the admin with withdrawal details.
 * - RequestWithdrawalInput - The input type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { sendEmail } from '@/lib/send-email';

const RequestWithdrawalInputSchema = z.object({
  userEmail: z.string().email().describe("The user's email address."),
  userName: z.string().describe("The user's name."),
  amount: z.number().positive().describe('The amount requested for withdrawal.'),
  method: z.string().describe('The withdrawal method (e.g., Vodafone Cash).'),
  details: z.string().describe('The payment details provided by the user (e.g., phone number).'),
});

export type RequestWithdrawalInput = z.infer<typeof RequestWithdrawalInputSchema>;

export async function requestWithdrawal(
  input: RequestWithdrawalInput
): Promise<void> {
  await requestWithdrawalFlow(input);
}

const sendEmailTool = ai.defineTool(
  {
    name: 'sendEmailTool',
    description: 'Sends an email to the site administrator.',
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

const requestWithdrawalFlow = ai.defineFlow(
  {
    name: 'requestWithdrawalFlow',
    inputSchema: RequestWithdrawalInputSchema,
    outputSchema: z.void(),
  },
  async (input) => {
    const adminEmail = "hagaaty@gmail.com";
    const subject = `[URGENT] طلب سحب أرباح جديد: ${input.amount.toFixed(2)}$ من ${input.userName}`;
    
    const html = `
      <html dir="rtl" lang="ar">
        <body style="font-family: sans-serif; text-align: right; background-color: #f9f9f9; padding: 20px;">
          <div style="max-width: 600px; margin: auto; background-color: #ffffff; border: 1px solid #ddd; border-radius: 8px; padding: 30px;">
            <h1 style="color: #c2410c; font-size: 24px; border-bottom: 2px solid #eee; padding-bottom: 15px;">
              🚨 طلب سحب أرباح جديد
            </h1>
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              هناك طلب سحب جديد من أحد المسوقين. يرجى مراجعة التفاصيل أدناه وتحويل المبلغ يدويًا.
            </p>
            <div style="background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 6px; padding: 20px; margin: 25px 0;">
              <h2 style="margin: 0; color: #92400e; font-size: 20px;">تفاصيل الطلب</h2>
              <table style="width: 100%; margin-top: 15px; border-collapse: collapse; font-size: 16px;">
                <tr style="border-bottom: 1px solid #fde08a;">
                  <td style="padding: 10px; font-weight: bold; color: #333;">اسم المسوق:</td>
                  <td style="padding: 10px; color: #555;">${input.userName}</td>
                </tr>
                <tr style="border-bottom: 1px solid #fde08a;">
                  <td style="padding: 10px; font-weight: bold; color: #333;">البريد الإلكتروني:</td>
                  <td style="padding: 10px; color: #555;">${input.userEmail}</td>
                </tr>
                <tr style="border-bottom: 1px solid #fde08a;">
                  <td style="padding: 10px; font-weight: bold; color: #333;">المبلغ المطلوب:</td>
                  <td style="padding: 10px; color: #16a34a; font-weight: bold; font-size: 18px;">${input.amount.toFixed(2)}$</td>
                </tr>
                <tr style="border-bottom: 1px solid #fde08a;">
                  <td style="padding: 10px; font-weight: bold; color: #333;">طريقة الدفع:</td>
                  <td style="padding: 10px; color: #555;"><strong>${input.method}</strong></td>
                </tr>
                <tr>
                  <td style="padding: 10px; font-weight: bold; color: #333;">تفاصيل التحويل:</td>
                  <td style="padding: 10px; color: #555; font-weight: bold; font-family: monospace;">${input.details}</td>
                </tr>
              </table>
            </div>
            <h2 style="margin-top: 30px; color: #333; font-size: 20px;">الخطوات التالية</h2>
            <ol style="color: #555; font-size: 16px; line-height: 1.8; padding-right: 20px;">
              <li>قم بتحويل المبلغ <strong>${input.amount.toFixed(2)}$</strong> إلى المستخدم باستخدام التفاصيل المذكورة أعلاه.</li>
              <li>اذهب إلى لوحة تحكم المسؤول > إدارة المستخدمين.</li>
              <li>ابحث عن المستخدم: <strong>${input.userEmail}</strong>.</li>
              <li>قم بتعديل رصيد "أرباح الشبكة" (Referral Earnings) يدويًا، بخصم المبلغ الذي تم تحويله.</li>
            </ol>
            <hr style="border: none; border-top: 1px solid #eee; margin-top: 25px;" />
            <p style="font-size: 12px; color: #999; text-align: center;">
              هذا بريد إلكتروني آلي من نظام حاجتي للذكاء الاصطناعي.
            </p>
          </div>
        </body>
      </html>
    `;

    await ai.generate({
      prompt: `أرسل بريدًا إلكترونيًا إلى المسؤول (${adminEmail}) لإعلامه بطلب سحب جديد.`,
      model: 'googleai/gemini-2.5-flash',
      tools: [sendEmailTool],
      toolConfig: {
          sendEmailTool: {
              to: adminEmail,
              subject,
              html,
          }
      }
    });
  }
);
