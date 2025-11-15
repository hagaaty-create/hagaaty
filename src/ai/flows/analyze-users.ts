'use server';
/**
 * @fileOverview An AI agent that fetches and ranks users for leaderboards.
 *
 * - analyzeUsers - The main function that fetches and processes user data.
 * - LeaderboardData - The output type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestore } from 'firebase-admin/firestore';
import { getApps, initializeApp } from 'firebase-admin/app';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';


// Initialize Firebase Admin SDK if not already initialized
if (!getApps().length) {
  initializeApp();
}

const db = getFirestore();

// Schemas
const UserSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  avatarUrl: z.string().optional().default('https://picsum.photos/seed/avatar-placeholder/40/40'), // Default avatar
  value: z.number(),
});

export const LeaderboardDataSchema = z.object({
  topBalances: z.array(UserSchema).describe('Top 10 users by advertising balance.'),
  topEarners: z.array(UserSchema).describe('Top 10 users by referral earnings.'),
  topReferrers: z.array(UserSchema).describe('Top 10 users by number of direct referrals.'),
});
export type LeaderboardData = z.infer<typeof LeaderboardDataSchema>;


// Helper function to fetch and map users for a specific leaderboard
async function getTopUsers(orderByField: string, limitCount: number = 10): Promise<z.infer<typeof UserSchema>[]> {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy(orderByField, 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        return [];
    }
    
    // Direct mapping without extra logic
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            displayName: data.displayName || 'مستخدم غير معروف',
            avatarUrl: data.photoURL || `https://i.pravatar.cc/150?u=${doc.id}`,
            value: data[orderByField] || 0,
        };
    });
}


// The main flow
const analyzeUsersFlow = ai.defineFlow(
  {
    name: 'analyzeUsersFlow',
    outputSchema: LeaderboardDataSchema,
  },
  async () => {
    console.log('[Flow] Starting user analysis for leaderboards.');
    
    // We can run these in parallel to speed things up
    const [topBalances, topEarners, topReferrers] = await Promise.all([
      getTopUsers('balance'),
      getTopUsers('referralEarnings'),
      getTopUsers('directReferralsCount'),
    ]);
    
    console.log('[Flow] Successfully analyzed users for all leaderboards.');
    return {
      topBalances,
      topEarners,
      topReferrers,
    };
  }
);


// Exported function to be called from the frontend
export async function analyzeUsers(): Promise<LeaderboardData> {
  return analyzeUsersFlow();
}
