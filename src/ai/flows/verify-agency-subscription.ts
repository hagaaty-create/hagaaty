'use server';

/**
 * @fileOverview An AI flow to "verify" an agency subscription payment, and handle MLM referral bonuses.
 *
 * - verifyAgencySubscription - The main flow function.
 * - VerifyAgencySubscriptionInput - The input type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { doc, runTransaction, getDoc, getDocs, collection, serverTimestamp, increment, writeBatch } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase/server-initialization';
import { sendEmail } from '@/lib/send-email';
import { notifyReferralBonus } from './notify-referral-bonus';
import type { FieldValue } from 'firebase/firestore';

const AGENCY_FEE = 40.00;

// Define input schema for the flow
const VerifyAgencySubscriptionInputSchema = z.object({
  userId: z.string().describe('The ID of the user subscribing.'),
  userEmail: z.string().email().describe("The user's email address for notifications."),
  paymentProofDataUri: z.string().describe('The payment proof image as a data URI.'),
});
export type VerifyAgencySubscriptionInput = z.infer<typeof VerifyAgencySubscriptionInputSchema>;

// Define the commission distribution for the 5-level MLM
const COMMISSION_POOL_PERCENTAGE = 0.10; // 10% of the agency fee
const LEVEL_DISTRIBUTION = [
    0.50,  // Level 1: 50% of the pool
    0.25,  // Level 2: 25% of the pool
    0.125, // Level 3: 12.5% of the pool
    0.0625, // Level 4: 6.25% of the pool
    0.0625, // Level 5: 6.25% of the pool
];


// Tool to process the MLM commissions for the agency subscription
const processAgencyMLMTool = ai.defineTool(
  {
    name: 'processAgencyMLM',
    description: "Distributes MLM commissions to a user's upline after they subscribe to the agency service and marks them as an agency member.",
    inputSchema: z.object({
      userId: z.string(),
      subscriptionAmount: z.number(),
    }),
    outputSchema: z.void(),
  },
  async ({ userId, subscriptionAmount }) => {
    console.log(`[Tool] Processing MLM commissions for agency subscription for user ${userId}.`);
    const { firestore } = initializeFirebase();
    const userRef = doc(firestore, 'users', userId);

    await runTransaction(firestore, async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists()) {
        throw new Error(`User with ID ${userId} not found.`);
      }
      const userData = userDoc.data()!;

      // Mark the user as an agency member
      transaction.update(userRef, { isAgencyMember: true });
      console.log(`[Tool] User ${userId} marked as agency member.`);

      const ancestors = userData.ancestors as string[] | undefined;

      if (ancestors && ancestors.length > 0) {
        console.log(`[Tool] User ${userId} has an upline. Processing agency MLM commissions.`);
        const commissionPool = subscriptionAmount * COMMISSION_POOL_PERCENTAGE;

        const ancestorRefs = ancestors.map(id => doc(firestore, 'users', id));
        // Use `getAll` outside the loop to fetch all docs at once within the transaction
        const ancestorDocs = await Promise.all(ancestorRefs.map(ref => transaction.get(ref)));

        for (let i = 0; i < ancestorDocs.length && i < LEVEL_DISTRIBUTION.length; i++) {
          const ancestorDoc = ancestorDocs[i];
          const commissionAmount = commissionPool * LEVEL_DISTRIBUTION[i];
          
          if (ancestorDoc.exists()) {
              console.log(`[Tool] Distributing $${commissionAmount.toFixed(4)} to Level ${i + 1} ancestor: ${ancestorDoc.id}`);
              transaction.update(ancestorDoc.ref, { referralEarnings: increment(commissionAmount) });

              const ancestorData = ancestorDoc.data()!;
              // Fire-and-forget notification
              notifyReferralBonus({
                  referrerEmail: ancestorData.email,
                  newUserName: userData.displayName,
                  commissionAmount: commissionAmount,
              }).catch(console.error);
          }
        }
      } else {
        console.log(`[Tool] No MLM commission processed for agency subscription. User has no upline.`);
      }
    });

    console.log(`[Tool] Successfully handled MLM logic for agency subscription for user ${userId}.`);
  }
);


// Tool to send notification to admin
const sendAdminNotificationTool = ai.defineTool(
  {
    name: 'sendAdminAgencyNotification',
    description: 'Sends an email notification to the admin about a successful or failed agency subscription.',
    inputSchema: z.object({
        success: z.boolean(),
        failureReason: z.string().optional(),
    }),
    outputSchema: z.void(),
  },
  async ({ success, failureReason }) => {
     // This function is just a placeholder to be called by the LLM.
     // The actual implementation detail is not needed here as the LLM just needs to know it exists.
  }
);


// The main flow
const verifyAgencySubscriptionFlow = ai.defineFlow(
  {
    name: 'verifyAgencySubscriptionFlow',
    inputSchema: VerifyAgencySubscriptionInputSchema,
    outputSchema: z.void(),
  },
  async (input) => {
    console.log(`[Flow] Starting agency subscription verification for user ${input.userEmail}`);
    
    // Define a prompt that forces the LLM to call our tools with specific parameters.
    // This is more robust than relying on the LLM to infer parameters.
    const prompt = `أنت نظام آلي للتحقق من اشتراكات الوكالة. لقد قدم المستخدم التالي إيصال دفع للاشتراك في خدمة الوكالة. "تحقق" من الصورة المرفقة.
- إذا بدت كإيصال دفع صالح، قم باستدعاء أداة 'processAgencyMLM' بالمعلمات التالية: userId=${input.userId}, subscriptionAmount=${AGENCY_FEE}. ثم استدع أداة 'sendAdminAgencyNotification' مع success=true.
- إذا لم تبدو كإيصال دفع صالح (غير واضحة، ليست إيصالًا، إلخ)، استدع فقط أداة 'sendAdminAgencyNotification' مع success=false وسبب فشل مناسب.

صورة الإيصال: {{media url="${input.paymentProofDataUri}"}}`;

    const { output } = await ai.generate({
      prompt: prompt,
      model: 'googleai/gemini-2.5-flash',
      tools: [processAgencyMLMTool, sendAdminNotificationTool],
    });

    // We can manually call the admin notification here to ensure it's always sent with full context
    // This is more reliable than letting the LLM construct the notification.
    const wasMlmProcessed = output?.toolCalls?.some(call => call.name === 'processAgencyMLM') ?? false;

    const subject = wasMlmProcessed
      ? `✅ اشتراك وكالة جديد: ${input.userEmail} دفع $${AGENCY_FEE}`
      : `🚨 فشل التحقق من اشتراك وكالة: ${input.userEmail}`;
      
    const html = `
      <div dir="rtl">
        <h1>${wasMlmProcessed ? 'اشتراك وكالة جديد وناجح' : 'فشل التحقق من اشتراك وكالة'}</h1>
        <p>قام المستخدم <strong>${input.userEmail}</strong> بمحاولة الاشتراك في خدمة الوكالة.</p>
        <ul>
          <li><strong>المبلغ:</strong> ${AGENCY_FEE}$</li>
          <li><strong>الحالة:</strong> ${wasMlmProcessed ? 'ناجح' : 'فشل'}</li>
          ${!wasMlmProcessed ? `<li><strong>سبب الفشل (حسب تقدير AI):</strong> لم يتم التعرف على الإيصال كإثبات دفع صالح.</li>` : ''}
        </ul>
        <p>${wasMlmProcessed ? 'تم التحقق من الإيصال بواسطة الذكاء الاصطناعي، تفعيل العضوية، وتوزيع عمولات الشبكة تلقائيًا.' : '<strong>مطلوب إجراء يدوي!</strong> يرجى التحقق من الإيصال وإتمام العملية يدويًا إذا كان صالحًا.'}</p>
        <p><strong>إيصال الدفع المرفق:</strong></p>
        <img src="${input.paymentProofDataUri}" alt="Payment Proof" style="max-width: 600px; border: 1px solid #ccc;"/>
      </div>
    `;

     await sendEmail({
      to: 'hagaaty@gmail.com', // Hardcoded admin email
      subject,
      html,
    });
    
    console.log(`[Flow] Agency subscription and MLM process initiated for ${input.userEmail}.`);
  }
);


export async function verifyAgencySubscription(input: VerifyAgencySubscriptionInput): Promise<void> {
  verifyAgencySubscriptionFlow(input);
}
