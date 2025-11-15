'use client';

import { generateMarketingContent } from '@/ai/flows/generate-marketing-content';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Bot, Gift, Loader2, Award, Info, RefreshCcw } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, serverTimestamp, increment, Timestamp } from 'firebase/firestore';
import { Progress } from '@/components/ui/progress';

type UserProfile = {
  id: string;
  points: number;
  balance: number;
  lastMarketingTriggerAt?: Timestamp;
};

const COOLDOWN_HOURS = 24;
const POINTS_PER_TRIGGER = 10;
const POINTS_FOR_REWARD = 100;
const REWARD_AMOUNT = 5;

export default function AgentPage() {
  const [isAgentRunning, setIsAgentRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState('');
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const { data: userProfile, loading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const canTriggerAgent = useMemo(() => {
    if (!userProfile || !userProfile.lastMarketingTriggerAt) return true;
    const lastTrigger = userProfile.lastMarketingTriggerAt.toDate();
    const now = new Date();
    const cooldownMillis = COOLDOWN_HOURS * 60 * 60 * 1000;
    return now.getTime() - lastTrigger.getTime() > cooldownMillis;
  }, [userProfile]);

  useEffect(() => {
    if (!userProfile?.lastMarketingTriggerAt) {
      setTimeLeft('');
      return;
    }

    const interval = setInterval(() => {
      const lastTrigger = userProfile.lastMarketingTriggerAt.toDate();
      const now = new Date();
      const cooldownEnd = new Date(lastTrigger.getTime() + COOLDOWN_HOURS * 60 * 60 * 1000);
      const diff = cooldownEnd.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('');
        clearInterval(interval);
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [userProfile]);

  const handleTriggerAgent = async () => {
    if (!canTriggerAgent || !userProfileRef || !userProfile) return;
    setIsAgentRunning(true);
    setError(null);
    try {
      // Trigger the marketing agent in the background (fire and forget)
      generateMarketingContent().catch(err => {
        // Log agent error but don't block user feedback
        console.error("Autonomous agent failed:", err);
      });

      const currentPoints = userProfile.points || 0;
      const newPoints = currentPoints + POINTS_PER_TRIGGER;
      
      if (newPoints >= POINTS_FOR_REWARD) {
        // Give reward and reset points
        const remainingPoints = newPoints - POINTS_FOR_REWARD;
        await updateDoc(userProfileRef, {
          points: remainingPoints,
          balance: increment(REWARD_AMOUNT),
          lastMarketingTriggerAt: serverTimestamp(),
        });
        toast({
          title: '🎉 تهانينا! لقد حصلت على مكافأة!',
          description: `تمت إضافة ${REWARD_AMOUNT}$ إلى رصيدك الإعلاني.`,
        });
      } else {
        // Just update points and timestamp
        await updateDoc(userProfileRef, {
          points: increment(POINTS_PER_TRIGGER),
          lastMarketingTriggerAt: serverTimestamp(),
        });
        toast({
          title: '✅ شكراً لمساهمتك!',
          description: `لقد حصلت على ${POINTS_PER_TRIGGER} نقاط. الوكيل يعمل الآن في الخلفية لتحسين الموقع.`,
        });
      }

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      toast({
        variant: 'destructive',
        title: 'حدث خطأ',
        description: 'لم نتمكن من تسجيل مساهمتك. يرجى المحاولة مرة أخرى.',
      });
    } finally {
      setIsAgentRunning(false);
    }
  };
  
  const points = userProfile?.points || 0;
  const progress = (points / POINTS_FOR_REWARD) * 100;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Bot className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold font-headline">الوكيل المستقل</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>ساهم في نمو الموقع واكسب المكافآت</CardTitle>
          <CardDescription>
           عندما تضغط على الزر أدناه، فإنك تأمر وكيل الذكاء الاصطناعي بالقيام بجولة عمل: تحليل الموقع، كتابة محتوى جديد، ونشره لتحسين ظهورنا في محركات البحث. مقابل كل مرة تشغله، تكسب ${POINTS_PER_TRIGGER} نقاط.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <Card className="bg-muted/50 p-6 text-center">
                <p className="text-sm text-muted-foreground mb-2">تقدمك نحو المكافأة التالية</p>
                 <div className="relative h-6 w-full max-w-sm mx-auto bg-primary/10 rounded-full border border-primary/20">
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="font-bold text-primary text-sm z-10">{points} / {POINTS_FOR_REWARD} نقطة</span>
                    </div>
                    <Progress value={progress} className="absolute h-full w-full left-0 top-0 bg-transparent" />
                </div>
                 <p className="text-xs text-muted-foreground mt-3">اجمع {POINTS_FOR_REWARD} نقطة واحصل على ${REWARD_AMOUNT} رصيد إعلاني مجاني!</p>
            </Card>

            <div className="text-center">
              <Button onClick={handleTriggerAgent} disabled={isAgentRunning || !canTriggerAgent || isProfileLoading} size="lg" className="h-14 text-lg w-full max-w-md mx-auto">
                {isAgentRunning || isProfileLoading ? (
                  <Loader2 className="ml-2 h-6 w-6 animate-spin" />
                ) : (
                   <RefreshCcw className="ml-2 h-6 w-6" />
                )}
                {isProfileLoading ? 'جاري التحميل...' : (isAgentRunning ? 'الوكيل يعمل...' : `شغّل الوكيل واكسب ${POINTS_PER_TRIGGER} نقاط`)}
              </Button>
            </div>

            {timeLeft && (
              <div className="text-center text-muted-foreground font-mono text-lg">
                يمكنك تشغيل الوكيل مرة أخرى بعد: {timeLeft}
              </div>
            )}
            
            {error && (
                 <p className="text-sm text-center text-destructive">{error}</p>
            )}
        </CardContent>
        <CardFooter className='bg-background/30'>
             <div className="flex items-start gap-3 text-sm text-muted-foreground">
                <Info className="h-5 w-5 mt-0.5 shrink-0" />
                <span>يمكنك تشغيل الوكيل مرة واحدة كل {COOLDOWN_HOURS} ساعة. هذه المساهمة تساعد الذكاء الاصطناعي على العمل باستمرار لجلب المزيد من الزوار للموقع عبر محركات البحث، مما يعود بالفائدة على الجميع.</span>
             </div>
        </CardFooter>
      </Card>
    </div>
  );
}
