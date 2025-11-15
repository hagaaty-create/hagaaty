'use client';

import { useDoc, useFirestore, useUser, useMemoFirebase, useCollection } from "@/firebase";
import { doc, collection, query, where, getDocs, getCountFromServer } from "firebase/firestore";
import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Share2, Copy, Check, DollarSign, Users, Gift, Network, Bot, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import type { Timestamp } from "firebase/firestore";
import { analyzeDownline, DownlineAnalysisInput } from "@/ai/flows/analyze-downline";
import { Label } from "@/components/ui/label";

type UserProfile = {
  id: string;
  displayName: string;
  email: string;
  referralCode?: string;
  referralEarnings?: number;
  referredBy?: string;
  createdAt?: Timestamp;
}

type DownlineReport = {
    levels: { level: number; count: number; }[];
    summary: string;
}

const commissionLevels = [
    { level: 1, rate: "5.0%" },
    { level: 2, rate: "2.5%" },
    { level: 3, rate: "1.25%" },
    { level: 4, rate: "0.625%" },
    { level: 5, rate: "0.625%" },
];


export default function ReferralsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [downlineReport, setDownlineReport] = useState<DownlineReport | null>(null);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(true);

  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const referralsQuery = useMemoFirebase(() => {
    if (!firestore || !userProfile?.referralCode) return null;
    return query(collection(firestore, 'users'), where('referredBy', '==', userProfile.referralCode));
  }, [firestore, userProfile]);
  
  const { data: referrals, isLoading: areReferralsLoading } = useCollection<UserProfile>(referralsQuery);
  
  useEffect(() => {
    const fetchAndAnalyzeDownline = async () => {
      if (!user || !firestore) return;

      setIsAnalysisLoading(true);
      try {
        const usersRef = collection(firestore, 'users');
        const levelPromises = [];
        // Fetch count for each of the 5 levels
        for (let i = 0; i < 5; i++) {
            const q = query(usersRef, where(`ancestors.${i}`, '==', user.uid));
            levelPromises.push(getCountFromServer(q));
        }

        const levelSnapshots = await Promise.all(levelPromises);
        const levelCounts = levelSnapshots.map((snapshot, index) => ({
          level: index + 1,
          count: snapshot.data().count,
        }));
        
        // Ensure we always have 5 levels, even if some are 0
        const fullLevelData: {level: number, count: number}[] = Array.from({length: 5}, (_, i) => {
            const found = levelCounts.find(l => l.level === i + 1);
            return found || { level: i + 1, count: 0 };
        });

        // Now, call the AI flow with the data we fetched on the client
        const analysisInput: DownlineAnalysisInput = { levels: fullLevelData };
        const result = await analyzeDownline(analysisInput);

        setDownlineReport({
            levels: fullLevelData,
            summary: result.summary,
        });

      } catch (err) {
        console.error("Failed to analyze downline:", err);
        toast({ variant: 'destructive', title: 'فشل تحليل الشبكة', description: 'لم نتمكن من تحليل شبكتك. قد يكون هذا بسبب مشكلة في الاتصال.'});
      } finally {
        setIsAnalysisLoading(false);
      }
    };
    
    fetchAndAnalyzeDownline();
  }, [user, firestore, toast]);

  const referralLink = useMemo(() => {
    if (typeof window === 'undefined' || !userProfile?.referralCode) return '';
    return `${window.location.origin}/signup?ref=${userProfile.referralCode}`;
  }, [userProfile]);

  const copyToClipboard = (text: string) => {
    if (!text) return;
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
  
  const isLoading = isProfileLoading || areReferralsLoading || isAnalysisLoading;

  if (isLoading && !downlineReport) {
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

       <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3"><Gift className="h-6 w-6 text-primary" /> أداة بناء الثروة الخاصة بك</CardTitle>
          <CardDescription>هذا هو مركز عملياتك في التسويق الشبكي. شارك رابطك، وراقب نمو فريقك، وشاهد أرباحك تتزايد.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <Label htmlFor="referral-link" className="text-base font-semibold text-primary-foreground/90">رابط الإحالة الخاص بك</Label>
              <p className="text-sm text-primary-foreground/70 mb-2">شارك هذا الرابط في كل مكان لبناء شبكتك!</p>
              <div className="flex items-center gap-2">
                  <Input id="referral-link" value={referralLink} readOnly className="bg-background/70"/>
                  <Button variant="default" size="icon" onClick={() => copyToClipboard(referralLink)} disabled={!referralLink}>
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
              </div>
            </div>
        </CardContent>
      </Card>


      <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
              <CardTitle className="flex items-center gap-3">
                  <Network className="h-6 w-6"/>
                  <span>اكسب من شبكتك بالكامل (MLM)</span>
              </CardTitle>
              <CardDescription>
                  لا تكسب فقط من أصدقائك، بل اكسب من أصدقاء أصدقائك حتى 5 مستويات. عندما يقوم أي شخص في شبكتك بشحن رصيده، ستحصل على عمولة.
              </CardDescription>
          </CardHeader>
          <CardContent>
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>المستوى</TableHead>
                          <TableHead>نسبة العمولة</TableHead>
                          <TableHead>مثال توضيحي</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {commissionLevels.map(item => (
                          <TableRow key={item.level}>
                              <TableCell className="font-bold">المستوى {item.level}</TableCell>
                              <TableCell className="font-mono text-primary font-bold">{item.rate}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">عندما يقوم عضو في هذا المستوى بشحن 100$، يكون ربحك هو {item.rate} من هذا المبلغ</TableCell>
                          </TableRow>
                      ))}
                  </TableBody>
              </Table>
          </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3"><Bot className="h-6 w-6 text-primary"/> تحليل المدرب الذكي</CardTitle>
        </CardHeader>
        <CardContent>
          {isAnalysisLoading ? (
            <div className="flex items-center gap-3 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>يقوم المدرب الذكي بتحليل شبكتك الآن...</span>
            </div>
          ) : downlineReport && (
            <div className="space-y-4">
                <p className="text-base text-muted-foreground italic bg-muted/50 p-4 rounded-lg">"{downlineReport.summary}"</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      {downlineReport.levels.map(l => <TableHead key={l.level} className="text-center">المستوى {l.level}</TableHead>)}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                       {downlineReport.levels.map(l => (
                          <TableCell key={l.level} className="text-center font-bold text-2xl">
                              {l.count}
                           </TableCell>
                        ))}
                    </TableRow>
                  </TableBody>
                </Table>
            </div>
          )}
        </CardContent>
      </Card>


      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">إجمالي أرباح الشبكة</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">${(userProfile?.referralEarnings || 0).toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">يمكن سحبها عبر فودافون كاش</p>
              </CardContent>
          </Card>
           <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">الإحالات المباشرة (المستوى 1)</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{referrals?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">مستخدم جديد انضم مباشرة من خلالك</p>
              </CardContent>
          </Card>
      </div>

      <Card>
           <CardHeader>
              <CardTitle>قائمة المستخدمين الذين دعوتهم مباشرة (المستوى 1)</CardTitle>
              <CardDescription>هنا يمكنك تتبع من قام بالتسجيل باستخدام الرمز الخاص بك. أرباحك لا تقتصر عليهم فقط!</CardDescription>
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
                      <p>ابدأ بمشاركة رمزك الآن وابدأ في بناء شبكتك!</p>
                  </div>
              )}
          </CardContent>
      </Card>

    </div>
  );
}
