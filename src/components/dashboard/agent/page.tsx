'use client';

import { generateMarketingContent, type GenerateMarketingContentOutput } from "@/ai/flows/generate-marketing-content";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Bot, Gift, Loader2, Award, Info, RefreshCcw, Milestone, Lightbulb, Twitter, Send } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, serverTimestamp, increment, Timestamp } from 'firebase/firestore';
import { Progress } from '@/components/ui/progress';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import Image from 'next/image';
import Link from 'next/link';

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

const agentSteps = [
    { text: "تحليل أحدث مقال في المدونة...", duration: 1500 },
    { text: "تطوير استراتيجية تسويق فريدة...", duration: 2000 },
    { text: "صياغة منشور جذاب لمنصة X (تويتر)...", duration: 2500 },
    { text: "توليد أفكار صور إبداعية للحملة...", duration: 1500 },
    { text: "إنشاء الصورة النهائية للحملة...", duration: 3000 },
    { text: "تجميع الحملة النهائية...", duration: 1000 },
];


export default function AgentPage() {
  const [isAgentRunning, setIsAgentRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState('');
  const [campaignResult, setCampaignResult] = useState<GenerateMarketingContentOutput | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(-1);
  
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

  const runAgentSteps = async () => {
    for (let i = 0; i < agentSteps.length; i++) {
        setCurrentStep(i);
        await new Promise(resolve => setTimeout(resolve, agentSteps[i].duration));
    }
  };


  const handleTriggerAgent = async () => {
    if (!canTriggerAgent || !userProfileRef || !userProfile) return;
    
    setIsAgentRunning(true);
    setError(null);
    setCampaignResult(null);
    setCurrentStep(0);
    
    // Start showing agent steps simulation
    const stepPromise = runAgentSteps();

    // Start the actual background task
    const campaignPromise = generateMarketingContent();

    try {
        const [_, result] = await Promise.all([stepPromise, campaignPromise]);
        
        setCampaignResult(result);
        setCurrentStep(agentSteps.length); // Mark as complete

        // Update user points and timestamp after successful campaign generation
        const currentPoints = userProfile.points || 0;
        const newPoints = currentPoints + POINTS_PER_TRIGGER;
        
        let updateData: any;
        if (newPoints >= POINTS_FOR_REWARD) {
          const remainingPoints = newPoints - POINTS_FOR_REWARD;
          updateData = {
            points: remainingPoints,
            balance: increment(REWARD_AMOUNT),
            lastMarketingTriggerAt: serverTimestamp(),
          };
          toast({
            title: '🎉 تهانينا! لقد حصلت على مكافأة!',
            description: `تمت إضافة ${REWARD_AMOUNT}$ إلى رصيدك الإعلاني.`,
          });
        } else {
          updateData = {
            points: increment(POINTS_PER_TRIGGER),
            lastMarketingTriggerAt: serverTimestamp(),
          };
          toast({
            title: '✅ شكراً لمساهمتك!',
            description: `لقد حصلت على ${POINTS_PER_TRIGGER} نقاط.`,
          });
        }
        updateDocumentNonBlocking(userProfileRef, updateData);

    } catch (err) {
        console.error("Autonomous agent failed:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred.");
        toast({ variant: 'destructive', title: "فشل الوكيل", description: "حدث خطأ أثناء تشغيل الوكيل." });
    } finally {
        setIsAgentRunning(false);
        // Don't reset currentStep here to show the final state
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
        </CardContent>
        <CardFooter className='bg-background/30'>
             <div className="flex items-start gap-3 text-sm text-muted-foreground">
                <Info className="h-5 w-5 mt-0.5 shrink-0" />
                <span>يمكنك تشغيل الوكيل مرة واحدة كل {COOLDOWN_HOURS} ساعة. هذه المساهمة تساعد الذكاء الاصطناعي على العمل باستمرار لجلب المزيد من الزوار للموقع عبر محركات البحث، مما يعود بالفائدة على الجميع.</span>
             </div>
        </CardFooter>
      </Card>
      
      {(isAgentRunning || campaignResult || error) && (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-2xl">سجل عمل الوكيل</CardTitle>
                <CardDescription>شاهد ما يقوم به الذكاء الاصطناعي بفضل مساهمتك.</CardDescription>
            </CardHeader>
            <CardContent>
                {isAgentRunning && currentStep < agentSteps.length && (
                    <div className="space-y-4">
                        {agentSteps.map((step, index) => (
                           <div key={index} className={`flex items-center gap-3 transition-opacity duration-500 ${index <= currentStep ? 'opacity-100' : 'opacity-30'}`}>
                                {index < currentStep ? (
                                    <Bot className="h-5 w-5 text-green-500" />
                                ) : (
                                    <Loader2 className={`h-5 w-5 ${index === currentStep ? 'animate-spin text-primary' : 'text-muted-foreground'}`}/>
                                )}
                               <span className={index === currentStep ? 'font-semibold text-primary' : 'text-muted-foreground'}>{step.text}</span>
                           </div>
                        ))}
                    </div>
                )}
                 {error && (
                    <div className="text-center py-12 text-destructive">
                        <p>فشل تشغيل الوكيل.</p>
                        <p className="text-sm">{error}</p>
                    </div>
                )}
                {campaignResult && (
                    <div className="space-y-8 animate-in fade-in-50 duration-500">
                        <h3 className="text-center text-xl font-bold text-green-600">🎉 تم إنشاء الحملة بنجاح!</h3>
                        <div className="grid gap-8 lg:grid-cols-2">
                             <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-lg"><Milestone className="h-5 w-5 text-primary"/> المقال المستهدف</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <h3 className="font-semibold text-lg">{campaignResult.article.title}</h3>
                                        <p className="text-sm text-muted-foreground mt-1 mb-4">{campaignResult.article.excerpt}</p>
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/articles/${campaignResult.article.slug}`} target="_blank">
                                                اقرأ المقال
                                            </Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                                <Card className="bg-primary/5">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-lg"><Bot className="h-5 w-5 text-primary"/> استراتيجية الوكيل</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground">{campaignResult.strategy}</p>
                                    </CardContent>
                                </Card>
                            </div>
                             <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                         <CardTitle className="flex items-center gap-2 text-lg">
                                            الصورة المولدة للحملة
                                         </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="relative aspect-video w-full rounded-lg overflow-hidden border shadow-sm">
                                            <Image src={campaignResult.imageUrl} alt="Generated Campaign Image" fill className="object-cover" />
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                     <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-lg"><Twitter className="h-5 w-5 text-sky-500"/> منشور X (تويتر)</CardTitle>
                                     </CardHeader>
                                     <CardContent className="space-y-4">
                                        <p className="whitespace-pre-wrap">{campaignResult.socialPosts.xPost.text}</p>
                                        <div className="flex flex-wrap gap-1">
                                            {campaignResult.socialPosts.xPost.hashtags.map(tag => <span key={tag} className="text-sm text-primary font-semibold">{tag}</span>)}
                                        </div>
                                     </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
      )}

    </div>
  );
}