import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PenSquare } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="grid gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Dashboard</CardTitle>
          <CardDescription>Welcome back! Here's your personalized content hub.</CardDescription>
        </CardHeader>
        <CardContent>
            <p>From here you can manage your articles, generate new content using AI, and more.</p>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="flex flex-col">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-headline">AI Article Generator</CardTitle>
                    <PenSquare className="h-6 w-6 text-primary"/>
                </div>
                <CardDescription>Create a new blog post from a simple prompt.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
                <p>Leverage the power of generative AI to craft engaging articles in seconds. Just provide a topic or a title, and let our AI do the rest.</p>
            </CardContent>
            <div className="p-6 pt-0">
                <Button asChild className="w-full">
                    <Link href="/dashboard/generate">Generate New Article</Link>
                </Button>
            </div>
        </Card>
         <Card>
            <CardHeader>
                <CardTitle className="text-xl font-headline">My Articles</CardTitle>
                <CardDescription>View and manage your published content.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-3xl font-bold">12</p>
                <p className="text-xs text-muted-foreground">+2 since last month</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle className="text-xl font-headline">Account Settings</CardTitle>
                <CardDescription>Manage your profile and preferences.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Update your personal information and customize your experience.</p>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
