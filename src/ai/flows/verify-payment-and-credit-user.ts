'use server';

/**
 * @fileOverview An AI flow to "verify" a payment receipt, credit the user's balance, and handle referral bonuses.
 *
 * - verifyPaymentAndCreditUser - The main flow function.
 * - VerifyPaymentInput - The input type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getApps, initializeApp } from 'firebase-admin/app';
import { sendEmail } from '@/lib/send-email';
import { notifyReferralBonus } from './notify-referral-bonus';
import { notifySuccessfulCredit } from './notify-successful-credit';

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

// Tool to credit the user's balance
const creditUserBalanceTool = ai.defineTool(
  {
    name: 'creditUserBalance',
    description: "Updates a user's balance and checks for referral bonuses.",
    inputSchema: z.object({
      userId: z.string(),
      amount: z.number(),
    }),
    outputSchema: z.void(),
  },
  async ({ userId, amount }) => {
    console.log(`[Tool] Crediting user ${userId} with $${amount}`);
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      throw new Error(`User with ID ${userId} not found.`);
    }

    const userData = userDoc.data()!;
    const referredBy = userData.referredBy; // The ID of the user who referred them

    // Transaction to ensure atomicity
    await db.runTransaction(async (transaction) => {
      // 1. Credit the new user's balance
      transaction.update(userRef, { balance: FieldValue.increment(amount) });

      // 2. Check if this user was referred and if it's their first deposit (check if their balance was ~2)
      // We check for balance < 5 to consider the initial $2 welcome bonus.
      if (referredBy && userData.balance < 5) {
        console.log(`[Tool] User ${userId} was referred by ${referredBy}. Processing referral bonus.`);
        const referrerRef = db.collection('users').doc(referredBy);
        const commission = amount * 0.20; // 20% commission
        
        // Add commission to the referrer's earnings
        transaction.update(referrerRef, { referralEarnings: FieldValue.increment(commission) });
        
        // Fire-and-forget notification to the referrer
        const referrerDoc = await transaction.get(referrerRef);
        if (referrerDoc.exists()) {
            const referrerData = referrerDoc.data()!;
            notifyReferralBonus({
                referrerEmail: referrerData.email,
                newUserName: userData.displayName,
                commissionAmount: commission,
            }).catch(console.error);
        }
      }
    });

    console.log(`[Tool] Successfully credited user ${userId} and handled referral logic.`);
  }
);


// Tool to send notification to admin
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
    
    // IMPORTANT: This is a simulation.
    // Here, we use the LLM to "act" as the verification system.
    await ai.generate({
      prompt: `أنت نظام آلي للتحقق من عمليات الدفع. لقد قدم المستخدم التالي إيصال دفع. "تحقق" من الصورة المرفقة. إذا بدت كإيصال دفع صالح، قم باستدعاء أداة 'creditUserBalance' لإضافة الرصيد إلى حسابه، ثم استدع أداة 'sendAdminNotification' لإرسال إشعار للمسؤول.

معلومات المستخدم:
- البريد الإلكتروني: ${input.userEmail}
- المبلغ: ${input.amount}
- طريقة الدفع: ${input.paymentMethod}
- صورة الإيصال: {{media url=paymentProofDataUri}}

قم باستدعاء الأدوات بالترتيب الصحيح.`,
      model: 'googleai/gemini-2.5-flash',
      tools: [creditUserBalanceTool, sendAdminNotificationTool],
      toolConfig: {
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

    // Notify the user that their credit has been added, fire-and-forget.
    notifySuccessfulCredit({ userEmail: input.userEmail, amount: input.amount }).catch(console.error);

    console.log(`[Flow] Payment verification and crediting process initiated for ${input.userEmail}.`);
  }
);


// Exported function to be called from the frontend
export async function verifyPaymentAndCreditUser(input: VerifyPaymentInput): Promise<void> {
  await verifyPaymentFlow(input);
}
