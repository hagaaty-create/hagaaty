import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, PenSquare, Wallet, Zap } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="grid gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Dashboard</CardTitle>
          <CardDescription>Welcome to your AI-powered advertising hub.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
           <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$4.00</div>
                <p className="text-xs text-muted-foreground">Welcome bonus applied</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">Ready to launch your first campaign?</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Spending</CardTitle>
                <BarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$0.00</div>
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
