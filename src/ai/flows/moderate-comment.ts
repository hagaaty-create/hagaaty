'use server';
/**
 * @fileOverview An AI agent that moderates user-submitted comments.
 *
 * - moderateComment - Analyzes a comment and decides if it should be posted.
 * - ModerateCommentInput - The input type for the function.
 * - ModerateCommentOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Define input and output schemas
export const ModerateCommentInputSchema = z.object({
  commentText: z.string().describe('The text of the user-submitted comment.'),
});
export type ModerateCommentInput = z.infer<typeof ModerateCommentInputSchema>;


export const ModerateCommentOutputSchema = z.object({
  shouldPost: z.boolean().describe("True if the comment is appropriate and should be posted, false otherwise."),
  reason: z.string().optional().describe("A brief, user-facing reason in Arabic explaining why the comment was rejected, if applicable."),
});
export type ModerateCommentOutput = z.infer<typeof ModerateCommentOutputSchema>;


const moderationPrompt = ai.definePrompt({
    name: 'moderateCommentPrompt',
    input: { schema: ModerateCommentInputSchema },
    output: { schema: ModerateCommentOutputSchema },
    prompt: `أنت مشرف محتوى صارم ولكن عادل. مهمتك هي تحليل التعليق التالي وتحديد ما إذا كان مناسبًا للنشر.

معايير الرفض (إذا تطابق أي منها، يجب رفض التعليق):
- يحتوي على أي شكل من أشكال الكلام البذيء، السباب، أو الشتائم.
- يهاجم شخصًا أو مجموعة بشكل مباشر.
- يحتوي على بريد عشوائي (spam) أو روابط غير مرغوب فيها.
- غير ذي صلة بالموضوع بشكل كامل.
- يحتوي على خطاب كراهية أو تمييز.

التعليق لتحليله:
"{{{commentText}}}"

مهمتك:
1.  حلل التعليق بناءً على المعايير أعلاه.
2.  إذا كان التعليق غير مناسب، اضبط 'shouldPost' على 'false' وقدم سببًا مختصرًا ومهذبًا للرفض باللغة العربية (مثال: "يحتوي التعليق على لغة غير لائقة" أو "يرجى الحفاظ على حوار بناء ومحترم").
3.  إذا كان التعليق مناسبًا، اضبط 'shouldPost' على 'true'.`,
});


const moderateCommentFlow = ai.defineFlow(
  {
    name: 'moderateCommentFlow',
    inputSchema: ModerateCommentInputSchema,
    outputSchema: ModerateCommentOutputSchema,
  },
  async (input) => {
    const { output } = await moderationPrompt(input);
    if (!output) {
      // Default to rejecting if the AI fails to produce a valid output
      return {
        shouldPost: false,
        reason: 'فشل تحليل التعليق. يرجى المحاولة مرة أخرى.',
      };
    }
    return output;
  }
);


export async function moderateComment(
  input: ModerateCommentInput
): Promise<ModerateCommentOutput> {
  return moderateCommentFlow(input);
}
