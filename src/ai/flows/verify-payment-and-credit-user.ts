'use server';

/**
 * @fileOverview An AI flow to "verify" a payment receipt, credit the user's balance, and handle MLM referral bonuses.
 *
 * - verifyPaymentAndCreditUser - The main flow function.
 * - VerifyPaymentInput - The input type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { doc, FieldValue, runTransaction, collection, getDocs, increment } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase/server-initialization';
import { sendEmail } from '@/lib/send-email';
import { notifyReferralBonus } from './notify-referral-bonus';
import { notifySuccessfulCredit } from './notify-successful-credit';


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
    const { firestore } = initializeFirebase();
    const userRef = doc(firestore, 'users', userId);

    // Use a transaction to ensure atomicity
    await runTransaction(firestore, async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists()) {
        throw new Error(`User with ID ${userId} not found.`);
      }
      const userData = userDoc.data()!;

      // 1. Credit the new user's balance
      transaction.update(userRef, { balance: increment(amount) });
      console.log(`[Tool] Credited user ${userId} with $${amount}.`);

      // 2. Check if this is the user's first deposit and if they have an upline (ancestors)
      const isFirstDeposit = (userData.balance || 0) < 5;
      const ancestors = userData.ancestors as string[] | undefined;

      if (isFirstDeposit && ancestors && ancestors.length > 0) {
        console.log(`[Tool] User ${userId} has an upline. Processing MLM commissions.`);
        const commissionPool = amount * COMMISSION_POOL_PERCENTAGE;

        // Fetch all ancestor documents in one go for efficiency
        const ancestorRefs = ancestors.map(id => doc(firestore, 'users', id));
        const ancestorDocs = await Promise.all(ancestorRefs.map(ref => transaction.get(ref)));
        
        // Distribute commissions to each ancestor
        for (let i = 0; i < ancestorDocs.length && i < LEVEL_DISTRIBUTION.length; i++) {
          const ancestorDoc = ancestorDocs[i];
          const commissionAmount = commissionPool * LEVEL_DISTRIBUTION[i];

          if (ancestorDoc.exists()) {
              console.log(`[Tool] Distributing $${commissionAmount.toFixed(4)} to Level ${i + 1} ancestor: ${ancestorDoc.id}`);
              transaction.update(ancestorDoc.ref, { referralEarnings: increment(commissionAmount) });
              
              const ancestorData = ancestorDoc.data()!;
              // Fire-and-forget email notification to the referrer
               notifyReferralBonus({
                   referrerEmail: ancestorData.email,
                   newUserName: userData.displayName,
                   commissionAmount: commissionAmount,
               }).catch(console.error);
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
    description: 'Sends an email notification to the admin about a successful or failed transaction.',
    inputSchema: z.object({
        userEmail: z.string(),
        amount: z.number(),
        paymentMethod: z.string(),
        paymentProofDataUri: z.string(),
        success: z.boolean(),
        failureReason: z.string().optional(),
    }),
    outputSchema: z.void(),
  },
  async ({ userEmail, amount, paymentMethod, paymentProofDataUri, success, failureReason }) => {
    console.log(`[Tool] Sending admin notification for user ${userEmail}`);
    const subject = success
        ? `✅ عملية شحن ناجحة: ${userEmail} أضاف $${amount}`
        : `🚨 فشل التحقق من عملية شحن: ${userEmail}`;
        
    const html = `
      <div dir="rtl">
        <h1>${success ? 'عملية شحن جديدة وناجحة' : 'فشل التحقق من عملية شحن'}</h1>
        <p>قام المستخدم <strong>${userEmail}</strong> بمحاولة شحن رصيده.</p>
        <ul>
          <li><strong>المبلغ:</strong> ${amount}$</li>
          <li><strong>طريقة الدفع:</strong> ${paymentMethod}</li>
          <li><strong>الحالة:</strong> ${success ? 'ناجح' : 'فشل'}</li>
           ${!success ? `<li><strong>سبب الفشل (حسب تقدير AI):</strong> ${failureReason}</li>` : ''}
        </ul>
        <p>${success ? 'تم التحقق من الإيصال بواسطة الذكاء الاصطناعي وإضافة الرصيد وتوزيع عمولات الشبكة تلقائيًا.' : '<strong>مطلوب إجراء يدوي!</strong> يرجى التحقق من الإيصال وإضافة الرصيد للمستخدم يدويًا إذا كان صالحًا.'}</p>
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
    
    const { "tool-results": toolResults, output } = await ai.generate({
      prompt: `أنت نظام آلي للتحقق من عمليات الدفع. لقد قدم المستخدم التالي إيصال دفع. "تحقق" من الصورة المرفقة.
- إذا بدت كإيصال دفع صالح للمبلغ المحدد، قم باستدعاء أداة 'creditUserAndProcessMLM' لإضافة الرصيد، ثم استدع أداة 'sendAdminNotification' مع success=true.
- إذا لم تبدو كإيصال دفع صالح (غير واضحة، ليست إيصالًا، المبلغ خطأ، إلخ)، استدع فقط أداة 'sendAdminNotification' مع success=false وسبب الفشل.

معلومات المستخدم:
- البريد الإلكتروني: ${input.userEmail}
- المبلغ: ${input.amount}
- طريقة الدفع: ${input.paymentMethod}
- صورة الإيصال: {{media url="${input.paymentProofDataUri}"}}`,
      model: 'googleai/gemini-2.5-flash',
      tools: [creditUserAndProcessMLMTool, sendAdminNotificationTool],
      toolConfig: {
        tool_choice: 'auto',
        execution: {
            'creditUserAndProcessMLM': {
              userId: input.userId,
              amount: input.amount,
            },
            'sendAdminNotification': {
              userEmail: input.userEmail,
              amount: input.amount,
              paymentMethod: input.paymentMethod,
              paymentProofDataUri: input.paymentProofDataUri,
            },
        }
      },
    });

    // We can check if 'creditUserAndProcessMLM' was called to determine success.
    const wasCreditSuccessful = toolResults.some(result => result.toolName === 'creditUserAndProcessMLM');

    if (wasCreditSuccessful) {
        // Notify the user that their credit has been added, fire-and-forget.
        notifySuccessfulCredit({ userEmail: input.userEmail, amount: input.amount }).catch(console.error);
    }
    
    console.log(`[Flow] Payment verification and crediting process initiated for ${input.userEmail}.`);
  }
);


// Exported function to be called from the frontend
export async function verifyPaymentAndCreditUser(input: VerifyPaymentInput): Promise<void> {
  // This is a fire-and-forget call. The client does not wait for this to complete.
  verifyPaymentFlow(input);
}
