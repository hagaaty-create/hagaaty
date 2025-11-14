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
import { Users } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { collectionGroup, query, orderBy, getDocs, doc, getDoc, where } from 'firebase/firestore';
import { useMemo, useState, useEffect } from 'react';
import { format } from 'date-fns';
import type { Timestamp } from 'firebase/firestore';

type AdCampaign = {
  id: string;
  productName: string;
  headline: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  createdAt: Timestamp;
  user?: {
    id: string;
    email?: string;
  };
};

export default function AllCampaignsPage() {
  const firestore = useFirestore();
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firestore) return;

    const fetchAllCampaigns = async () => {
      setLoading(true);
      const campaignsQuery = query(
        collectionGroup(firestore, 'campaigns'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(campaignsQuery);
      
      const campaignsData = snapshot.docs.map(doc => {
        const data = doc.data();
        const parentDoc = doc.ref.parent.parent; // This gets the user document
        return {
          id: doc.id,
          ...data,
          user: {
            id: parentDoc?.id || 'unknown',
            email: 'جاري التحميل...', // Placeholder
          }
        } as AdCampaign;
      });

      // Fetch user emails efficiently
      const userIds = [...new Set(campaignsData.map(c => c.user?.id).filter(Boolean) as string[])];
      const usersMap = new Map<string, string>();
      
      if (userIds.length > 0 && firestore) {
          // Firestore 'in' query is limited to 30 items. 
          // If you expect more users, you'd need to batch this.
          const usersQuery = query(collection(firestore, 'users'), where('__name__', 'in', userIds));
          const usersSnapshot = await getDocs(usersQuery);
          usersSnapshot.forEach(userDoc => {
              usersMap.set(userDoc.id, userDoc.data().email || 'غير موجود');
          });
      }

      const populatedCampaigns = campaignsData.map(campaign => {
          if (campaign.user) {
              return {
                  ...campaign,
                  user: {
                      ...campaign.user,
                      email: usersMap.get(campaign.user.id) || 'غير موجود'
                  }
              }
          }
          return campaign;
      });

      setCampaigns(populatedCampaigns);
      setLoading(false);
    };

    fetchAllCampaigns();
  }, [firestore]);


  const formatDate = (timestamp: Timestamp | null) => {
    if (!timestamp) return 'N/A';
    if (timestamp instanceof Timestamp) {
      return format(timestamp.toDate(), 'PPP');
    }
    return format(new Date(timestamp), 'PPP');
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Users className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold font-headline">جميع حملات المستخدمين</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>جميع الحملات</CardTitle>
          <CardDescription>
            عرض لجميع الحملات الإعلانية التي أنشأها جميع المستخدمين عبر المنصة.
          </CardDescription>
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
                  <TableHead>المستخدم</TableHead>
                  <TableHead>المنتج</TableHead>
                  <TableHead>العنوان الرئيسي</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>تاريخ الإنشاء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map(campaign => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium text-muted-foreground">{campaign.user?.email}</TableCell>
                    <TableCell className="font-medium">{campaign.productName}</TableCell>
                    <TableCell>{campaign.headline}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          campaign.status === 'active' ? 'default' : 'secondary'
                        }
                      >
                        {campaign.status}
                      </Badge>
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
