'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDoc, useFirestore, useUser, useCollection } from "@/firebase";
import { doc, collection, query, orderBy } from "firebase/firestore";
import { BarChart, PenSquare, Wallet, Zap, Loader2 } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";


type UserProfile = {
  id: string;
  displayName: string;
  email: string;
  balance?: number;
}

type AdCampaign = {
    id: string;
    productName: string;
    headline: string;
    status: 'draft' | 'active' | 'paused' | 'completed';
};

const AD_COST = 1.00;

export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemo(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const { data: userProfile, loading: userLoading } = useDoc<UserProfile>(userProfileRef);

  const campaignsQuery = useMemo(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'users', user.uid, 'campaigns'), orderBy('createdAt', 'desc'));
  }, [user, firestore]);

  const { data: campaigns, loading: campaignsLoading } = useCollection<AdCampaign>(campaignsQuery);
  
  const totalSpent = useMemo(() => {
      if (!campaigns) return 0;
      return campaigns.length * AD_COST;
  }, [campaigns]);
  
  const activeCampaigns = useMemo(() => {
      if (!campaigns) return 0;
      // For now we count all campaigns as "active" for the dashboard display
      return campaigns.length;
  }, [campaigns]);

  return (
    <div className="grid gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Dashboard</CardTitle>
          <CardDescription>Welcome back, {user?.displayName || 'User'}.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
           <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {userLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                   <div className="text-2xl font-bold">${userProfile?.balance?.toFixed(2) || '0.00'}</div>
                )}
                <p className="text-xs text-muted-foreground">This includes your welcome bonus!</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                 {campaignsLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                 ) : (
                    <div className="text-2xl font-bold">{activeCampaigns}</div>
                 )}
                <p className="text-xs text-muted-foreground">Ready to launch your first campaign?</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Spending</CardTitle>
                <BarChart className="h-4 w-4 text-muted-foreground" />
              </Header>
              <CardContent>
                 {campaignsLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                 ) : (
                    <div className="text-2xl font-bold">${totalSpent.toFixed(2)}</div>
                 )}
                 <p className="text-xs text-muted-foreground">Across all campaigns</p>
              </CardContent>
            </Card>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="flex flex-col">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-headline">AI Ad Generator</CardTitle>
                    <PenSquare className="h-6 w-6 text-primary"/>
                </div>
                <CardDescription>Create a new ad campaign from a simple prompt.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
                <p>Leverage the power of generative AI to craft compelling ad copy and campaign strategies in seconds. Just provide your goal and let our AI do the rest.</p>
            </CardContent>
            <div className="p-6 pt-0">
                <Button asChild className="w-full">
                    <Link href="/dashboard/create-ad">Create New Ad</Link>
                </Button>
            </div>
        </Card>
         <Card className="flex flex-col">
            <CardHeader>
                <CardTitle className="text-xl font-headline">Campaign Performance</CardTitle>
                <CardDescription>Monitor the performance of your campaigns.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
                <p>Track clicks, impressions, and conversions for all your campaigns in one place. Our AI provides insights to help you optimize for better results.</p>
            </CardContent>
             <div className="p-6 pt-0">
                <Button asChild className="w-full" variant="outline">
                    <Link href="/dashboard/campaigns">View My Campaigns</Link>
                </Button>
            </div>
        </Card>
      </div>
    </div>
  );
}
