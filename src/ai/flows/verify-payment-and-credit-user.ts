'use server';

/**
 * @fileOverview An AI flow to "verify" a payment receipt and credit a user's balance.
 *
 * - verifyPaymentAndCreditUser - The main flow function.
 * - VerifyPaymentInput - The input type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getApps, initializeApp } from 'firebase-admin/app';
import { sendEmail } from '@/lib/send-email';

// Initialize Firebase Admin SDK if not already initialized
if (!getApps().length) {
  initializeApp();
}

const db = getFirestore();

// Define input schema for the flow
const VerifyPaymentInputSchema = z.object({
  userId: z.string().describe('The ID of the user to credit.'),
  userEmail: z.string().email().describe("The user's email address for notifications."),
  paymentProofDataUri: z.string().describe('The payment proof image as a data URI.'),
  amount: z.number().positive().describe('The amount to credit.'),
  paymentMethod: z.string().describe('The payment method used.'),
});
export type VerifyPaymentInput = z.infer<typeof VerifyPaymentInputSchema>;

// Define a tool for the AI to update the user's balance in Firestore
const creditUserBalanceTool = ai.defineTool(
  {
    name: 'creditUserBalance',
    description: 'Updates the balance for a specified user in the database.',
    inputSchema: z.object({
      userId: z.string(),
      amount: z.number(),
    }),
    outputSchema: z.void(),
  },
  async ({ userId, amount }) => {
    console.log(`[Tool] Crediting user ${userId} with $${amount}`);
    const userRef = db.collection('users').doc(userId);
    await userRef.update({
      balance: FieldValue.increment(amount),
    });
    console.log(`[Tool] Successfully credited user ${userId}.`);
  }
);

// Define a tool to send a notification email to the admin
const sendAdminNotificationTool = ai.defineTool(
  {
    name: 'sendAdminNotification',
    description: 'Sends an email notification to the admin about a successful transaction.',
    inputSchema: z.object({
      userEmail: z.string(),
      amount: z.number(),
      paymentMethod: z.string(),
      paymentProofDataUri: z.string(),
    }),
    outputSchema: z.void(),
  },
  async ({ userEmail, amount, paymentMethod, paymentProofDataUri }) => {
    console.log(`[Tool] Sending admin notification for user ${userEmail}`);
    const subject = `✅ عملية شحن ناجحة: ${userEmail} أضاف $${amount}`;
    const html = `
      <div dir="rtl">
        <h1>عملية شحن جديدة وناجحة</h1>
        <p>قام المستخدم <strong>${userEmail}</strong> بشحن رصيده بنجاح.</p>
        <ul>
          <li><strong>المبلغ:</strong> ${amount}$</li>
          <li><strong>طريقة الدفع:</strong> ${paymentMethod}</li>
        </ul>
        <p>تم التحقق من الإيصال بواسطة الذكاء الاصطناعي وإضافة الرصيد تلقائيًا.</p>
        <p><strong>إيصال الدفع المرفق:</strong></p>
        <img src="${paymentProofDataUri}" alt="Payment Proof" style="max-width: 600px; border: 1px solid #ccc;"/>
      </div>
    `;
    await sendEmail({
      to: 'hagaaty@gmail.com', // Hardcoded admin email
      subject,
      html,
    });
    console.log(`[Tool] Admin notification sent.`);
  }
);


// The main flow
const verifyPaymentFlow = ai.defineFlow(
  {
    name: 'verifyPaymentAndCreditUserFlow',
    inputSchema: VerifyPaymentInputSchema,
    outputSchema: z.void(),
  },
  async (input) => {
    console.log(`[Flow] Starting payment verification for user ${input.userEmail}`);
    
    // IMPORTANT: This is a simulation. A real implementation would use a proper
    // payment gateway's webhook or API to confirm payment status.
    // Here, we use the LLM to "act" as the verification system.
    await ai.generate({
      prompt: `أنت نظام آلي للتحقق من عمليات الدفع. لقد قدم المستخدم التالي إيصال دفع. "تحقق" من الصورة المرفقة. إذا بدت كإيصال دفع صالح، قم باستدعاء الأدوات اللازمة لإضافة الرصيد إلى حسابه وإرسال إشعار للمسؤول.

معلومات المستخدم:
- البريد الإلكتروني: ${input.userEmail}
- المبلغ: ${input.amount}
- طريقة الدفع: ${input.paymentMethod}
- صورة الإيصال: {{media url=paymentProofDataUri}}

قم باستدعاء الأدوات بالترتيب: أولاً 'creditUserBalance' ثم 'sendAdminNotification'.`,
      model: 'googleai/gemini-2.5-flash',
      tools: [creditUserBalanceTool, sendAdminNotificationTool],
      toolConfig: {
        // Pre-fill the tool parameters. The AI's job is just to call them.
        creditUserBalance: {
          userId: input.userId,
          amount: input.amount,
        },
        sendAdminNotification: {
          userEmail: input.userEmail,
          amount: input.amount,
          paymentMethod: input.paymentMethod,
          paymentProofDataUri: input.paymentProofDataUri,
        },
      },
    });

    console.log(`[Flow] Payment verification and crediting process initiated for ${input.userEmail}.`);
  }
);


// Exported function to be called from the frontend
export async function verifyPaymentAndCreditUser(input: VerifyPaymentInput): Promise<void> {
  await verifyPaymentFlow(input);
}
