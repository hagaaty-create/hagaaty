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
    performance: {
        impressions: number;
        clicks: number;
        ctr: number;
    }
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
                <h1 className="text-3xl font-bold font-headline">حملاتي</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>أداء الحملة</CardTitle>
                    <CardDescription>راجع أداء جميع حملاتك الإعلانية.</CardDescription>
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
                                    <TableHead>المنتج</TableHead>
                                    <TableHead>العنوان الرئيسي</TableHead>
                                    <TableHead>الحالة</TableHead>
                                    <TableHead className="text-right">مرات الظهور</TableHead>
                                    <TableHead className="text-right">النقرات</TableHead>
                                    <TableHead className="text-right">CTR</TableHead>
                                    <TableHead>تاريخ الإنشاء</TableHead>
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
                                        <TableCell className="text-right font-mono">{campaign.performance?.impressions?.toLocaleString() || 'N/A'}</TableCell>
                                        <TableCell className="text-right font-mono">{campaign.performance?.clicks?.toLocaleString() || 'N/A'}</TableCell>
                                        <TableCell className="text-right font-mono">
                                            {campaign.performance?.ctr ? `${(campaign.performance.ctr * 100).toFixed(2)}%` : 'N/A'}
                                        </TableCell>
                                        <TableCell>{formatDate(campaign.createdAt)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                     {!loading && (!campaigns || campaigns.length === 0) && (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>لم تقم بإنشاء أي حملات بعد.</p>
                            <p>اذهب إلى صفحة "إنشاء إعلان" لتوليد حملتك الأولى!</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
