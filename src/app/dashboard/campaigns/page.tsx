'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart, Loader2 } from "lucide-react";
import { useCollection, useFirestore, useUser } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { useMemo } from "react";
import { format } from 'date-fns';
import type { Timestamp } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

type AdCampaign = {
    id: string;
    productName: string;
    headline: string;
    status: 'draft' | 'active' | 'paused' | 'completed';
    createdAt: Timestamp;
};

export default function CampaignsPage() {
    const { user } = useUser();
    const firestore = useFirestore();

    const campaignsQuery = useMemo(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, 'users', user.uid, 'campaigns'), orderBy('createdAt', 'desc'));
    }, [user, firestore]);

    const { data: campaigns, loading } = useCollection<AdCampaign>(campaignsQuery);

    const formatDate = (timestamp: Timestamp | null) => {
        if (!timestamp) return 'N/A';
        return format(timestamp.toDate(), 'PPP');
    }

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
                    {loading && (
                        <div className="space-y-4">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    )}
                    {!loading && campaigns && campaigns.length > 0 && (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Headline</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Created</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {campaigns.map((campaign) => (
                                    <TableRow key={campaign.id}>
                                        <TableCell className="font-medium">{campaign.productName}</TableCell>
                                        <TableCell>{campaign.headline}</TableCell>
                                        <TableCell>
                                            <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>{campaign.status}</Badge>
                                        </TableCell>
                                        <TableCell>{formatDate(campaign.createdAt)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                     {!loading && (!campaigns || campaigns.length === 0) && (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>You haven't created any campaigns yet.</p>
                            <p>Go to the "Create Ad" page to generate your first one!</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
