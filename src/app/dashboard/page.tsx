'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDoc, useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection, query, orderBy } from "firebase/firestore";
import { BarChart, PenSquare, Wallet, Zap, Loader2, TrendingUp, Gift, Shield, Award, Users, Bot, Lightbulb } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import AdPreview from "@/components/dashboard/AdPreview";
import type { Timestamp } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import ProactiveAnalysis from "@/components/dashboard/ProactiveAnalysis";


type UserProfile = {
  id: string;
  displayName: string;
  email: string;
  balance?: number;
  achievements?: { id: string, name: string }[];
}

type AdCampaign = {
    id: string;
    productName: string;
    headline: string;
    body: string;
    websiteUrl: string;
    status: 'draft' | 'reviewing' | 'active' | 'paused' | 'completed';
    createdAt: Timestamp;
    performance: {
        impressions: number;
        clicks: number;
        ctr: number;
    }
};

const AD_COST = 2.00;

const WelcomeCard = ({ balance }: { balance?: number }) => (
    <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
        <CardHeader>
            <CardTitle className="flex items-center gap-3">
                <Gift className="h-6 w-6 text-primary"/>
                <span>ابدأ رحلتك نحو النجاح!</span>
            </CardTitle>
            <CardDescription>
                لقد أضفنا رصيدًا ترحيبيًا بقيمة ${balance?.toFixed(2) || '2.00'} إلى حسابك. استخدمه الآن لإطلاق أول حملة إعلانية لك وتجربة قوة الذكاء الاصطناعي.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Button asChild size="lg">
                <Link href="/dashboard/create-ad">
                    <PenSquare className="ml-2 h-5 w-5"/>
                    أنشئ حملتك الإعلانية الأولى
                </Link>
            </Button>
        </CardContent>
    </Card>
);

const allPossibleAchievements = [
    { id: 'ad_pioneer', name: 'رائد الإعلانات', icon: PenSquare, description: 'أنشئ حملتك الإعلانية الأولى' },
    { id: 'team_builder', name: 'بنّاء الفريق', icon: Users, description: 'قم بدعوة صديقك الأول' },
    { id: 'ai_contributor', name: 'مساهم في الذكاء', icon: Bot, description: 'شغّل الوكيل المستقل لأول مرة' },
    { id: 'reward_earner', name: 'صائد المكافآت', icon: Gift, description: 'اجمع 100 نقطة واحصل على مكافأة' },
];


export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const { data: userProfile, isLoading: userLoading } = useDoc<UserProfile>(userProfileRef);

  const campaignsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'users', user.uid, 'campaigns'), orderBy('createdAt', 'desc'));
  }, [user, firestore]);

  const { data: campaigns, loading: campaignsLoading } = useCollection<AdCampaign>(campaignsQuery);
  
  const latestCampaign = useMemo(() => campaigns?.[0], [campaigns]);

  const totalSpent = useMemo(() => {
      if (!campaigns) return 0;
      return campaigns.length * AD_COST;
  }, [campaigns]);
  
  const activeCampaignsCount = useMemo(() => {
      if (!campaigns) return 0;
      return campaigns.filter(c => c.status === 'active').length;
  }, [campaigns]);

  const userAchievements = useMemo(() => userProfile?.achievements || [], [userProfile]);
  const hasAchievement = (id: string) => userAchievements.some(a => a.id === id);
  
  const activeCampaignsData = useMemo(() => {
    if (!campaigns) return [];
    return campaigns.filter(c => c.status === 'active');
  }, [campaigns]);

  return (
    <div className="space-y-8">
      <Card className="bg-transparent border-0 shadow-none">
        <CardHeader>
          <CardTitle className="font-headline text-4xl">أهلاً بعودتك، {user?.displayName || 'مستخدم'}.</CardTitle>
          <CardDescription className="text-lg">هذه هي لوحة التحكم الخاصة بك.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
           <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">الرصيد الحالي</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {userLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                ) : (
                   <div className="text-2xl font-bold">${userProfile?.balance?.toFixed(2) || '0.00'}</div>
                )}
                <p className="text-xs text-muted-foreground">هذا يشمل الرصيد الترحيبي!</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">الحملات النشطة</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                 {campaignsLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                 ) : (
                    <div className="text-2xl font-bold">{activeCampaignsCount}</div>
                 )}
                <p className="text-xs text-muted-foreground">إجمالي الحملات التي تعمل حاليًا</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">إجمالي الإنفاق</CardTitle>
                <BarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                 {campaignsLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                 ) : (
                    <div className="text-2xl font-bold">${totalSpent.toFixed(2)}</div>
                 )}
                 <p className="text-xs text-muted-foreground">عبر جميع الحملات</p>
              </CardContent>
            </Card>
        </CardContent>
      </Card>
      
      {!campaignsLoading && activeCampaignsData.length > 1 && (
        <ProactiveAnalysis campaigns={activeCampaignsData} />
      )}
      
       <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center gap-2">
            <Award className="text-primary"/>
            إنجازاتك
          </CardTitle>
          <CardDescription>احتفل بكل خطوة في رحلتك نحو النجاح. أكمل المهام لجمع كل الشارات!</CardDescription>
        </CardHeader>
        <CardContent>
          {userLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {allPossibleAchievements.map(ach => {
                const isAchieved = hasAchievement(ach.id);
                const Icon = ach.icon;
                return (
                  <Card 
                    key={ach.id} 
                    className={`p-4 flex flex-col items-center justify-center text-center transition-all duration-300 ${isAchieved ? 'border-amber-500 bg-amber-500/10' : 'bg-muted/50'}`}
                  >
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center mb-2 ${isAchieved ? 'bg-amber-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                      <Icon size={24} />
                    </div>
                    <p className={`font-semibold text-sm ${isAchieved ? 'text-amber-600' : 'text-foreground'}`}>{ach.name}</p>
                    <p className="text-xs text-muted-foreground">{ach.description}</p>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>


      {campaignsLoading && (
        <Card>
          <CardHeader><CardTitle className="font-headline text-2xl">نظرة عامة على أحدث حملاتك</CardTitle></CardHeader>
          <CardContent className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      )}

      {!campaignsLoading && campaigns && campaigns.length === 0 && (
         <WelcomeCard balance={userProfile?.balance}/>
      )}

      {!campaignsLoading && latestCampaign && (
        <Card>
          <CardHeader><CardTitle className="font-headline text-2xl">نظرة عامة على أحدث حملاتك</CardTitle></CardHeader>
          <CardContent>
            <AdPreview campaign={latestCampaign} cost={AD_COST}/>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="flex flex-col">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-headline">مولد الإعلانات بالذكاء الاصطناعي</CardTitle>
                    <PenSquare className="h-6 w-6 text-primary"/>
                </div>
                <CardDescription>أنشئ حملة إعلانية جديدة من وصف بسيط.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
                <p className="text-muted-foreground">استفد من قوة الذكاء الاصطناعي التوليدي لصياغة نصوص إعلانية واستراتيجيات حملة مقنعة في ثوانٍ. ما عليك سوى تقديم هدفك والسماح للذكاء الاصطناعي بالقيام بالباقي.</p>
            </CardContent>
            <div className="p-6 pt-0">
                <Button asChild className="w-full">
                    <Link href="/dashboard/create-ad">إنشاء إعلان جديد</Link>
                </Button>
            </div>
        </Card>
         <Card className="flex flex-col">
            <CardHeader>
                 <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-headline">أداء الحملة</CardTitle>
                    <TrendingUp className="h-6 w-6 text-primary"/>
                 </div>
                <CardDescription>راقب أداء حملاتك بالتفصيل.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
                <p className="text-muted-foreground">تتبع النقرات ومرات الظهور والتحويلات لجميع حملاتك في مكان واحد. يوفر الذكاء الاصطناعي لدينا رؤى لمساعدتك على التحسين لتحقيق نتائج أفضل.</p>
            </CardContent>
             <div className="p-6 pt-0">
                <Button asChild className="w-full" variant="outline">
                    <Link href="/dashboard/campaigns">عرض حملاتي</Link>
                </Button>
            </div>
        </Card>
      </div>
    </div>
  );
}

    
