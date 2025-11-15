'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, DollarSign, MousePointerClick, Eye } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { collectionGroup, query, orderBy, getDocs, collection, where } from 'firebase/firestore';
import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import type { Timestamp } from 'firebase/firestore';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis } from "recharts";


type AdCampaign = {
  id: string;
  productName: string;
  headline: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'reviewing';
  createdAt: Timestamp;
  budget: number;
  user?: {
    id: string;
    email?: string;
  };
  performance: {
    impressions: number;
    clicks: number;
    ctr: number;
  }
};

type UserProfile = {
    id: string;
    email?: string;
}

export default function AllCampaignsPage() {
  const firestore = useFirestore();
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firestore) return;

    const fetchAllCampaignsAndUsers = async () => {
      setLoading(true);
      
      // 1. Fetch all users and create a map
      const usersRef = collection(firestore, 'users');
      const usersSnapshot = await getDocs(usersRef);
      const usersMap = new Map<string, UserProfile>();
      usersSnapshot.forEach(doc => {
          usersMap.set(doc.id, { id: doc.id, ...doc.data() } as UserProfile);
      });

      // 2. Fetch all campaigns using collectionGroup
      const campaignsQuery = query(
        collectionGroup(firestore, 'campaigns'),
        orderBy('createdAt', 'desc')
      );
      const campaignsSnapshot = await getDocs(campaignsQuery);
      
      // 3. Map user data to campaigns
      const campaignsData = campaignsSnapshot.docs.map(doc => {
        const data = doc.data();
        const userId = doc.ref.parent.parent?.id; // Get the user ID from the path
        const user = userId ? usersMap.get(userId) : undefined;
        
        return {
          id: doc.id,
          ...data,
          user: {
            id: userId || 'unknown',
            email: user?.email || 'غير موجود',
          }
        } as AdCampaign;
      });

      setCampaigns(campaignsData);
      setLoading(false);
    };

    fetchAllCampaignsAndUsers();
  }, [firestore]);

    const getStatusBadge = (status: AdCampaign['status']) => {
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

  const { chartData, totalImpressions, totalClicks, totalSpent, totalCampaigns } = useMemo(() => {
    if (!campaigns) {
        return { chartData: [], totalImpressions: 0, totalClicks: 0, totalSpent: 0, totalCampaigns: 0 };
    }
    const data = campaigns.map(c => ({
        name: c.productName.substring(0, 15) + '...',
        impressions: c.performance.impressions,
        clicks: c.performance.clicks
    })).slice(0, 10).reverse(); // Show last 10 campaigns, oldest first in chart
    
    const impressions = campaigns.reduce((acc, c) => acc + c.performance.impressions, 0);
    const clicks = campaigns.reduce((acc, c) => acc + c.performance.clicks, 0);
    const spent = campaigns.reduce((acc, c) => acc + (c.budget || 0), 0);

    return { chartData: data, totalImpressions: impressions, totalClicks: clicks, totalSpent: spent, totalCampaigns: campaigns.length };
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


  const formatDate = (timestamp: Timestamp | null) => {
    if (!timestamp) return 'N/A';
    if (timestamp instanceof Timestamp) {
      return format(timestamp.toDate(), 'PPP');
    }
    return format(new Date(timestamp), 'PPP');
  };

  if (loading) {
    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Users className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold font-headline">جميع حملات المستخدمين</h1>
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
        <Users className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold font-headline">جميع حملات المستخدمين</h1>
      </div>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">إجمالي الإنفاق</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">${totalSpent.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">على {totalCampaigns} حملة</p>
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
              <CardTitle>أداء أحدث الحملات</CardTitle>
              <CardDescription>
                  مقارنة بين النقرات ومرات الظهور لأحدث الحملات عبر المنصة.
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
                      <p>لا توجد بيانات لعرضها. لم يتم إنشاء أي حملات بعد.</p>
                  </div>
              )}
          </CardContent>
      </Card>


      <Card>
        <CardHeader>
          <CardTitle>جدول الحملات التفصيلي</CardTitle>
          <CardDescription>
            عرض لجميع الحملات الإعلانية التي أنشأها جميع المستخدمين عبر المنصة.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!loading && campaigns && campaigns.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المستخدم</TableHead>
                  <TableHead>المنتج</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-right">الميزانية</TableHead>
                  <TableHead className="text-right">مرات الظهور</TableHead>
                  <TableHead className="text-right">النقرات</TableHead>
                  <TableHead className="text-right">CTR</TableHead>
                  <TableHead>تاريخ الإنشاء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map(campaign => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium text-muted-foreground">{campaign.user?.email}</TableCell>
                    <TableCell className="font-medium">{campaign.productName}</TableCell>
                    <TableCell>
                      {getStatusBadge(campaign.status)}
                    </TableCell>
                    <TableCell className="text-right font-mono">${campaign.budget?.toFixed(2) || 'N/A'}</TableCell>
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
              <p>لم يتم إنشاء أي حملات من قبل أي مستخدم حتى الآن.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
