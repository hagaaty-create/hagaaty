import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart } from "lucide-react";

export default function CampaignsPage() {
    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <BarChart className="h-8 w-8 text-primary"/>
                <h1 className="text-3xl font-bold font-headline">My Campaigns</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Campaign Performance</CardTitle>
                    <CardDescription>Review the performance of all your ad campaigns.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>A list of campaigns will be displayed here.</p>
                </CardContent>
            </Card>
        </div>
    );
}
