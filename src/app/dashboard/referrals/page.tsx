
'use client';

import { useDoc, useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection, query, where, getDocs } from "firebase/firestore";
import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Share2, Copy, Check, DollarSign, Users, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import type { Timestamp } from "firebase/firestore";


type UserProfile = {
  id: string;
  displayName: string;
  email: string;
  referralCode?: string;
  referralEarnings?: number;
  referredBy?: string;
  createdAt?: Timestamp;
}

export default function ReferralsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const referralsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'users'), where('referredBy', '==', user.uid));
  }, [user, firestore]);
  
  const { data: referrals, isLoading: areReferralsLoading } = useCollection<UserProfile>(referralsQuery);
  
  const referralLink = useMemo(() => {
    if (!userProfile?.referralCode) return '';
    return `${window.location.origin}/signup?ref=${userProfile.referralCode}`;
  }, [userProfile]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast({ title: "تم النسخ!", description: "تم نسخ رابط الإحالة الخاص بك." });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const formatDate = (timestamp: Timestamp | undefined) => {
    if (!timestamp) return 'N/A';
    return format(timestamp.toDate(), 'PPP');
  };

  if (isProfileLoading || areReferralsLoading) {
    return (
        <div className="space-y-8">
             <div className="flex items-center gap-4">
                <Share2 className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold font-headline">برنامج الإحالة</h1>
            </div>
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-[126px]" />
                <Skeleton className="h-[126px]" />
                <Skeleton className="h-[126px]" />
            </div>
            <Skeleton className="h-[200px]" />
            <Skeleton className="h-[200px]" />
        </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Share2 className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold font-headline">برنامج الإحالة</h1>
      </div>
      <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
              <CardTitle className="flex items-center gap-2">
                  <Gift className="h-6 w-6"/>
                  اكسب المال عن طريق دعوة الأصدقاء
              </CardTitle>
              <CardDescription>
                  شارك رابط الإحالة الخاص بك. عندما يقوم صديقك بالتسجيل وشحن رصيده، ستحصل على عمولة 20% من قيمة شحنه الأول، وسيحصل صديقك على 2$ هدية إضافية!
              </CardDescription>
          </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">إجمالي أرباح الإحالة</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">${(userProfile?.referralEarnings || 0).toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">يمكن سحبها عبر فودافون كاش</p>
              </CardContent>
          </Card>
           <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">إجمالي الإحالات الناجحة</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{referrals?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">مستخدم جديد انضم من خلالك</p>
              </CardContent>
          </Card>
      </div>

       <Card>
          <CardHeader>
              <CardTitle>رمز الإحالة الخاص بك</CardTitle>
              <CardDescription>شارك هذا الرمز أو الرابط أدناه مع أصدقائك ليبدأوا في التسجيل.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
              <div>
                  <Label htmlFor="referral-code">رمز الإحالة</Label>
                  <div className="flex items-center gap-2">
                      <Input id="referral-code" value={userProfile?.referralCode || "جاري التحميل..."} readOnly />
                      <Button variant="outline" size="icon" onClick={() => copyToClipboard(userProfile?.referralCode || '')} disabled={!userProfile?.referralCode}>
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                  </div>
              </div>
              <div>
                   <Label htmlFor="referral-link">رابط الإحالة المباشر</Label>
                  <div className="flex items-center gap-2">
                      <Input id="referral-link" value={referralLink} readOnly />
                      <Button variant="outline" size="icon" onClick={() => copyToClipboard(referralLink)} disabled={!referralLink}>
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                  </div>
              </div>
          </CardContent>
      </Card>

      <Card>
           <CardHeader>
              <CardTitle>قائمة المستخدمين الذين قمت بدعوتهم</CardTitle>
              <CardDescription>هنا يمكنك تتبع من قام بالتسجيل باستخدام الرمز الخاص بك.</CardDescription>
          </CardHeader>
          <CardContent>
              {referrals && referrals.length > 0 ? (
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>الاسم</TableHead>
                              <TableHead>البريد الإلكتروني</TableHead>
                              <TableHead>تاريخ الانضمام</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {referrals.map(ref => (
                              <TableRow key={ref.id}>
                                  <TableCell className="font-medium">{ref.displayName}</TableCell>
                                  <TableCell className="text-muted-foreground">{ref.email}</TableCell>
                                  <TableCell>{formatDate(ref.createdAt)}</TableCell>
                              </TableRow>
                          ))}
                      </TableBody>
                  </Table>
              ) : (
                  <div className="text-center py-12 text-muted-foreground">
                      <p>لم يقم أي شخص بالتسجيل باستخدام رمزك بعد.</p>
                      <p>ابدأ بمشاركة رمزك الآن!</p>
                  </div>
              )}
          </CardContent>
      </Card>

    </div>
  );
}
