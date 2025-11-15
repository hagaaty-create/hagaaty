'use server';
/**
 * @fileOverview An AI flow for sending a welcome email to a new user.
 *
 * - sendWelcomeEmail - A function that sends a welcome email.
 * - SendWelcomeEmailInput - The input type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { sendEmail } from '@/lib/send-email';

const SendWelcomeEmailInputSchema = z.object({
  userName: z.string().describe("The new user's name."),
  userEmail: z.string().email().describe("The new user's email address."),
});

export type SendWelcomeEmailInput = z.infer<typeof SendWelcomeEmailInputSchema>;

export async function sendWelcomeEmail(
  input: SendWelcomeEmailInput
): Promise<void> {
  await sendWelcomeEmailFlow(input);
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

const sendWelcomeEmailFlow = ai.defineFlow(
  {
    name: 'sendWelcomeEmailFlow',
    inputSchema: SendWelcomeEmailInputSchema,
    outputSchema: z.void(),
  },
  async (input) => {
    const subject = `🎉 أهلاً بك في منصة حاجتي للذكاء الاصطناعي، ${input.userName}!`;
    const dashboardUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard`;
    const createAdUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard/create-ad`;
    const blogUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/blog`;
    
    const html = `
      <html dir="rtl" lang="ar">
        <body style="font-family: sans-serif; text-align: right; background-color: #f4f4f4; padding: 20px;">
          <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; padding: 30px; border: 1px solid #ddd;">
            <h1 style="color: #333; font-size: 24px;">مرحبًا بك، ${input.userName}!</h1>
            <p style="color: #555; font-size: 16px; line-height: 1.6;">
              يسعدنا انضمامك إلى منصة حاجتي، بوابتك لتسخير قوة الذكاء الاصطناعي في التسويق الرقمي.
            </p>
            <p style="font-size: 16px; line-height: 1.6;">
              لقد أضفنا <strong>رصيدًا ترحيبيًا بقيمة 2$</strong> إلى حسابك كهدية لتبدأ بها.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${createAdUrl}" style="background-color: #F59E0B; color: #1c1917; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                أنشئ حملتك الإعلانية الأولى
              </a>
            </div>
            <h2 style="color: #333; font-size: 20px; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-top: 40px;">ماذا بعد؟</h2>
            <ul style="list-style-type: none; padding: 0; color: #555;">
              <li style="margin-bottom: 15px;">- <a href="${dashboardUrl}" style="color: #F59E0B; text-decoration: none;">استكشف لوحة التحكم</a> الخاصة بك لإدارة حملاتك ورصيدك.</li>
              <li style="margin-bottom: 15px;">- <a href="${blogUrl}" style="color: #F59E0B; text-decoration: none;">اقرأ أحدث المقالات</a> التي تم إنشاؤها بواسطة الذكاء الاصطناعي.</li>
              <li style="margin-bottom: 15px;">- تحدث مع <a href="${dashboardUrl}" style="color: #F59E0B; text-decoration: none;">المساعد الذكي</a> (الأيقونة في أسفل يمين الشاشة) لأي سؤال.</li>
            </ul>
            <p style="color: #777; font-size: 14px; margin-top: 30px;">
              نحن متحمسون لرؤية ما ستبتكره!
            </p>
          </div>
        </body>
      </html>
    `;

    // Use a prompt to make the AI call the tool with the correct parameters
    await ai.generate({
      prompt: `أرسل بريدًا ترحيبيًا إلى المستخدم الجديد ${input.userName} (${input.userEmail}).`,
      model: 'googleai/gemini-2.5-flash',
      tools: [sendEmailTool],
      toolConfig: {
          sendEmailTool: {
              to: input.userEmail,
              subject,
              html,
          }
      }
    });
  }
);
