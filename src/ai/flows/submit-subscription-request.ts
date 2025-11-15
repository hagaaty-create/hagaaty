'use server';
/**
 * @fileOverview An AI flow for submitting a subscription request via email.
 *
 * - submitSubscriptionRequest - A function that sends an email with the user's details and payment proof.
 * - SubmitSubscriptionRequestInput - The input type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { sendEmail } from '@/lib/send-email';

const SubmitSubscriptionRequestInputSchema = z.object({
  userEmail: z.string().email().describe("The user's email address."),
  paymentProofDataUri: z
    .string()
    .describe(
      "The payment proof image as a data URI. Expected format: 'data:image/...;base64,<encoded_data>'."
    ),
});

export type SubmitSubscriptionRequestInput = z.infer<typeof SubmitSubscriptionRequestInputSchema>;

export async function submitSubscriptionRequest(
  input: SubmitSubscriptionRequestInput
): Promise<void> {
  await submitSubscriptionRequestFlow(input);
}

const sendEmailTool = ai.defineTool(
  {
    name: 'sendEmailTool',
    description: 'Sends an email to the support team.',
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


const submitSubscriptionRequestFlow = ai.defineFlow(
  {
    name: 'submitSubscriptionRequestFlow',
    inputSchema: SubmitSubscriptionRequestInputSchema,
    outputSchema: z.void(),
  },
  async (input) => {
    const subject = `طلب اشتراك وكالة جديد من: ${input.userEmail}`;
    const html = `
      <h1>طلب اشتراك جديد في وكالة حاجتي</h1>
      <p><strong>البريد الإلكتروني للمستخدم:</strong> ${input.userEmail}</p>
      <p><strong>إثبات الدفع:</strong></p>
      <img src="${input.paymentProofDataUri}" alt="Payment Proof" style="max-width: 600px;" />
    `;

    // The Gemini tool calling API has a size limit for parameters.
    // The Data URI can be large, so we pass a smaller version to the prompt and use the full one for the tool.
    const promptInputForSize = {
        ...input,
        paymentProofDataUri: input.paymentProofDataUri.substring(0, 100) + '...'
    };

    await ai.generate({
      prompt: `المستخدم (${promptInputForSize.userEmail}) قدم طلب اشتراك. استخدم الأداة لإرسال بريد إلكتروني إلى "hagaaty@gmail.com" مع التفاصيل.`,
      model: 'googleai/gemini-2.5-flash',
      tools: [sendEmailTool],
      toolConfig: {
          sendEmailTool: {
              to: "hagaaty@gmail.com",
              subject,
              html,
          }
      }
    });
  }
);

    