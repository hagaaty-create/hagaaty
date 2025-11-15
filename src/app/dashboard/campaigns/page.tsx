'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart, Loader2, DollarSign, MousePointerClick, Eye } from "lucide-react";
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { useMemo, Suspense } from "react";
import { format } from 'date-fns';
import type { Timestamp } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useSearchParams } from "next/navigation";
import CampaignReviewProgress from "@/components/dashboard/CampaignReviewProgress";

type AdCampaign = {
    id: string;
    productName: string;
    headline: string;
    status: 'draft' | 'reviewing' | 'active' | 'paused' | 'completed';
    createdAt: Timestamp;
    performance: {
        impressions: number;
        clicks: number;
        ctr: number;
    }
};

const AD_COST = 2.00;

function CampaignsPageContent() {
    const { user } = useUser();
    const firestore = useFirestore();
    const searchParams = useSearchParams();
    const newCampaignId = searchParams.get('newCampaignId');

    const campaignsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, 'users', user.uid, 'campaigns'), orderBy('createdAt', 'desc'));
    }, [user, firestore]);

    const { data: campaigns, loading } = useCollection<AdCampaign>(campaignsQuery);

    const formatDate = (timestamp: Timestamp | null) => {
        if (!timestamp) return 'N/A';
        return format(timestamp.toDate(), 'PPP');
    }

    const getStatusBadge = (status: AdCampaign['status'], campaignId: string) => {
        if (status === 'reviewing' && campaignId === newCampaignId) {
            return <CampaignReviewProgress campaignId={campaignId} />;
        }
        
        const variantMap: Record<AdCampaign['status'], 'default' | 'secondary' | 'outline' | 'destructive'> = {
            active: 'default',
            reviewing: 'secondary',
            paused: 'outline',
            completed: 'outline',
            draft: 'secondary',
        };
        
        const statusTextMap: Record<AdCampaign['status'], string> = {
            active: 'نشطة',
            reviewing: 'تحت المراجعة',
            paused: 'متوقفة',
            completed: 'مكتملة',
            draft: 'مسودة',
        };

        return <Badge variant={variantMap[status] || 'secondary'}>{statusTextMap[status]}</Badge>;
    };

    const { chartData, totalImpressions, totalClicks, totalSpent } = useMemo(() => {
        if (!campaigns) {
            return { chartData: [], totalImpressions: 0, totalClicks: 0, totalSpent: 0 };
        }
        const data = campaigns.map(c => ({
            name: c.productName.substring(0, 15) + '...',
            impressions: c.performance.impressions,
            clicks: c.performance.clicks
        })).reverse(); // Reverse to show oldest first in chart
        
        const impressions = campaigns.reduce((acc, c) => acc + c.performance.impressions, 0);
        const clicks = campaigns.reduce((acc, c) => acc + c.performance.clicks, 0);
        const spent = campaigns.length * AD_COST;

        return { chartData: data, totalImpressions: impressions, totalClicks: clicks, totalSpent: spent };
    }, [campaigns]);

    const chartConfig = {
        impressions: {
            label: "مرات الظهور",
            color: "hsl(var(--chart-1))",
        },
        clicks: {
            label: "النقرات",
            color: "hsl(var(--chart-2))",
        },
    } satisfies ChartConfig;

    if (loading) {
        return (
             <div className="space-y-8">
                <div className="flex items-center gap-4">
                    <BarChart className="h-8 w-8 text-primary"/>
                    <h1 className="text-3xl font-bold font-headline">حملاتي</h1>
                </div>
                 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Skeleton className="h-[126px]" />
                    <Skeleton className="h-[126px]" />
                    <Skeleton className="h-[126px]" />
                </div>
                <Skeleton className="h-[400px]" />
                <Skeleton className="h-[200px]" />
            </div>
        )
    }
    
    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <BarChart className="h-8 w-8 text-primary"/>
                <h1 className="text-3xl font-bold font-headline">حملاتي</h1>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">إجمالي الإنفاق</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${totalSpent.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">عبر جميع الحملات</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">إجمالي النقرات</CardTitle>
                        <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalClicks.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">من جميع الحملات</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">إجمالي مرات الظهور</CardTitle>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalImpressions.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">عبر جميع الحملات</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>مقارنة أداء الحملات</CardTitle>
                    <CardDescription>
                        مخطط شريطي يقارن بين النقرات ومرات الظهور لكل حملة.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {campaigns && campaigns.length > 0 ? (
                        <div className="h-[400px] w-full">
                            <ChartContainer config={chartConfig} className="h-full w-full">
                                <RechartsBarChart data={chartData} accessibilityLayer>
                                    <CartesianGrid vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        tickLine={false}
                                        tickMargin={10}
                                        axisLine={false}
                                        stroke="hsl(var(--muted-foreground))"
                                    />
                                    <YAxis stroke="hsl(var(--muted-foreground))" />
                                    <ChartTooltip
                                        cursor={false}
                                        content={<ChartTooltipContent />}
                                    />
                                    <Bar dataKey="impressions" fill="var(--color-impressions)" radius={4} />
                                    <Bar dataKey="clicks" fill="var(--color-clicks)" radius={4} />
                                </RechartsBarChart>
                            </ChartContainer>
                        </div>
                    ) : (
                         <div className="h-[400px] w-full flex items-center justify-center text-muted-foreground">
                            <p>لا توجد بيانات لعرضها. قم بإنشاء حملة أولاً.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>جدول الحملات التفصيلي</CardTitle>
                    <CardDescription>راجع أداء جميع حملاتك الإعلانية بالتفصيل.</CardDescription>
                </CardHeader>
                <CardContent>
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
                                            {getStatusBadge(campaign.status, campaign.id)}
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

export default function CampaignsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CampaignsPageContent />
        </Suspense>
    );
}
