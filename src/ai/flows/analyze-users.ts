'use server';
/**
 * @fileOverview An AI agent that fetches and ranks users for leaderboards.
 *
 * - analyzeUsers - The main function that fetches and processes user data.
 * - LeaderboardData - The output type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getApps, initializeApp } from 'firebase-admin/app';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';


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
async function getTopUsers(orderByField: string, valueField: string, limitCount: number = 10): Promise<z.infer<typeof UserSchema>[]> {
    const usersRef = db.collection('users');
    const q = query(usersRef, orderBy(orderByField, 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        return [];
    }

    const userPromises = snapshot.docs.map(async (doc) => {
        const data = doc.data();
        let value = data[valueField];

        // Special case for topReferrers, we need to count them
        if (valueField === 'directReferrals') {
            const referralsQuery = query(usersRef, where('referredBy', '==', data.referralCode));
            const referralsSnapshot = await getDocs(referralsQuery);
            value = referralsSnapshot.size;
        }

        return {
            id: doc.id,
            displayName: data.displayName || 'مستخدم غير معروف',
            avatarUrl: data.photoURL || `https://i.pravatar.cc/150?u=${doc.id}`,
            value: value || 0,
        };
    });

    let users = await Promise.all(userPromises);

    // If we were calculating directReferrals, we need to re-sort after counting
    if (valueField === 'directReferrals') {
        users.sort((a, b) => b.value - a.value);
    }
    
    return users;
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
      getTopUsers('balance', 'balance'),
      getTopUsers('referralEarnings', 'referralEarnings'),
      getTopUsers('createdAt', 'directReferrals'), // Order by creation date initially, then re-sort by count
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