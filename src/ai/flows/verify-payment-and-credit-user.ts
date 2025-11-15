'use server';

/**
 * @fileOverview An AI flow to "verify" a payment receipt, credit the user's balance, and handle MLM referral bonuses.
 *
 * - verifyPaymentAndCreditUser - The main flow function.
 * - VerifyPaymentInput - The input type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestore, FieldValue, DocumentReference } from 'firebase-admin/firestore';
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

// Define the commission distribution for the 5-level MLM
const COMMISSION_POOL_PERCENTAGE = 0.10; // 10%
const LEVEL_DISTRIBUTION = [
    0.50,  // Level 1: 50% of the pool
    0.25,  // Level 2: 25% of the pool
    0.125, // Level 3: 12.5% of the pool
    0.0625, // Level 4: 6.25% of the pool
    0.0625, // Level 5: 6.25% of the pool
];


// Tool to credit the user's balance and process the MLM commissions
const creditUserAndProcessMLMTool = ai.defineTool(
  {
    name: 'creditUserAndProcessMLM',
    description: "Updates a user's balance and distributes MLM commissions to their upline.",
    inputSchema: z.object({
      userId: z.string(),
      amount: z.number(),
    }),
    outputSchema: z.void(),
  },
  async ({ userId, amount }) => {
    console.log(`[Tool] Crediting user ${userId} with $${amount} and processing MLM commissions.`);
    const userRef = db.collection('users').doc(userId);

    // Use a transaction to ensure atomicity
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) {
        throw new Error(`User with ID ${userId} not found.`);
      }
      const userData = userDoc.data()!;

      // 1. Credit the new user's balance
      transaction.update(userRef, { balance: FieldValue.increment(amount) });
      console.log(`[Tool] Credited user ${userId} with $${amount}.`);

      // 2. Check if this is the user's first deposit and if they have an upline (ancestors)
      // We check for a low balance to approximate a "first deposit" scenario
      const isFirstDeposit = userData.balance < 5;
      const ancestors = userData.ancestors as string[] | undefined;

      if (isFirstDeposit && ancestors && ancestors.length > 0) {
        console.log(`[Tool] User ${userId} has an upline. Processing MLM commissions.`);
        const commissionPool = amount * COMMISSION_POOL_PERCENTAGE;

        // Distribute commissions to each ancestor
        for (let i = 0; i < ancestors.length && i < LEVEL_DISTRIBUTION.length; i++) {
          const ancestorId = ancestors[i];
          const commissionAmount = commissionPool * LEVEL_DISTRIBUTION[i];
          const ancestorRef = db.collection('users').doc(ancestorId);

          console.log(`[Tool] Distributing $${commissionAmount.toFixed(4)} to Level ${i + 1} ancestor: ${ancestorId}`);
          transaction.update(ancestorRef, { referralEarnings: FieldValue.increment(commissionAmount) });

          // Fire-and-forget email notification to the referrer (only for the direct referrer for now)
          if (i === 0) {
             const ancestorDoc = await transaction.get(ancestorRef);
             if (ancestorDoc.exists()) {
                 const ancestorData = ancestorDoc.data()!;
                 notifyReferralBonus({
                     referrerEmail: ancestorData.email,
                     newUserName: userData.displayName,
                     commissionAmount: commissionAmount,
                 }).catch(console.error);
             }
          }
        }
      } else {
        console.log(`[Tool] No MLM commission processed. First deposit: ${isFirstDeposit}, Ancestors: ${ancestors?.length || 0}`);
      }
    });

    console.log(`[Tool] Successfully credited user ${userId} and handled MLM logic.`);
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
        <p>تم التحقق من الإيصال بواسطة الذكاء الاصطناعي وإضافة الرصيد وتوزيع عمولات الشبكة تلقائيًا.</p>
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
    
    await ai.generate({
      prompt: `أنت نظام آلي للتحقق من عمليات الدفع وتوزيع عمولات التسويق الشبكي (MLM). لقد قدم المستخدم التالي إيصال دفع. "تحقق" من الصورة المرفقة. إذا بدت كإيصال دفع صالح، قم باستدعاء أداة 'creditUserAndProcessMLM' لإضافة الرصيد إلى حسابه وتوزيع العمولات على شبكته، ثم استدع أداة 'sendAdminNotification' لإرسال إشعار للمسؤول.

معلومات المستخدم:
- البريد الإلكتروني: ${input.userEmail}
- المبلغ: ${input.amount}
- طريقة الدفع: ${input.paymentMethod}
- صورة الإيصال: {{media url=paymentProofDataUri}}

قم باستدعاء الأدوات بالترتيب الصحيح.`,
      model: 'googleai/gemini-2.5-flash',
      tools: [creditUserAndProcessMLMTool, sendAdminNotificationTool],
      toolConfig: {
        creditUserAndProcessMLM: {
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
  // This is a fire-and-forget call. The client does not wait for this to complete.
  verifyPaymentFlow(input);
}
