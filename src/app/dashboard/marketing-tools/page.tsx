'use client';

import { generateAffiliateMaterial, type GenerateAffiliateMaterialOutput } from "@/ai/flows/generate-affiliate-material";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Bot, Lightbulb, Loader2, Sparkles, RefreshCw, Send, Twitter, Copy, Check, Download, Mail, Video } from "lucide-react";
import Image from "next/image";
import { useState, useEffect, useMemo } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Input } from "@/components/ui/input";

type UserProfile = {
    referralCode?: string;
}

export default function MarketingToolsPage() {
    const [campaign, setCampaign] = useState<GenerateAffiliateMaterialOutput | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isPublishing, setIsPublishing] = useState<Record<string, boolean>>({});
    const [error, setError] = useState<string | null>(null);
    const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
    const { toast } = useToast();
    const { user } = useUser();
    const firestore = useFirestore();

    const userProfileRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'users', user.uid);
    }, [user, firestore]);

    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);
    
    const referralLink = useMemo(() => {
        if (typeof window === 'undefined' || !userProfile?.referralCode) return '';
        return `${window.location.origin}/signup?ref=${userProfile.referralCode}`;
    }, [userProfile]);

    const fetchMarketingCampaign = async () => {
        if (!referralLink) return;
        setIsLoading(true);
        setError(null);
        try {
            const result = await generateAffiliateMaterial({ referralLink });
            setCampaign(result);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "An unknown error occurred while generating content.");
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        if(referralLink) {
            fetchMarketingCampaign();
        }
    }, [referralLink]);

    const copyToClipboard = (textToCopy: string, id: string) => {
        navigator.clipboard.writeText(textToCopy);
        toast({ title: 'تم نسخ المحتوى!' });
        setCopiedStates(prev => ({ ...prev, [id]: true }));
        setTimeout(() => setCopiedStates(prev => ({ ...prev, [id]: false })), 2000);
    };

    const handlePublish = (platform: string) => {
        setIsPublishing(prev => ({ ...prev, [platform]: true }));
        setTimeout(() => {
            toast({ title: `تم النشر على ${platform} (محاكاة)` });
            setIsPublishing(prev => ({ ...prev, [platform]: false }));
        }, 1500);
    };
    
    const handleDownload = (url: string, filename: string) => {
        if (!url) return;
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Sparkles className="h-8 w-8 text-primary" />
                    <h1 className="text-3xl font-bold font-headline">أدوات التسويق بالذكاء الاصطناعي</h1>
                </div>
                 <Button onClick={fetchMarketingCampaign} disabled={isLoading || isProfileLoading || !referralLink} variant="outline">
                    <RefreshCw className={`ml-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    توليد حملة جديدة
                </Button>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>مركزك الإبداعي للتسويق</CardTitle>
                    <CardDescription>
                        يقوم وكيل الذكاء الاصطناعي الشخصي الخاص بك بإنشاء حملات تسويقية جاهزة للنشر. استخدم هذه المواد لجذب عملاء جدد ومسوقين آخرين لشبكتك.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Card className="bg-muted/50">
                        <CardHeader>
                            <CardTitle className="text-lg">رابط الإحالة الخاص بك</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                {isProfileLoading ? <Skeleton className="h-10 w-full" /> : <Input value={referralLink} readOnly />}
                                <Button variant="outline" size="icon" onClick={() => copyToClipboard(referralLink, 'referralLink')} disabled={!referralLink}>
                                    {copiedStates['referralLink'] ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </CardContent>
            </Card>

            {isLoading && <CampaignSkeleton />}
            {error && (
                <div className="text-center py-12 text-destructive">
                    <p>فشل تحميل الحملة التسويقية.</p>
                    <p className="text-sm">{error}</p>
                </div>
            )}
            {!isLoading && !error && campaign && (
                <div className="grid gap-8 lg:grid-cols-2">
                     <div className="space-y-6">
                        {campaign.imageUrl && (
                            <Card>
                                <CardHeader>
                                     <CardTitle className="flex items-center gap-2 text-lg">
                                        الصورة المولدة للحملة
                                     </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="relative aspect-video w-full rounded-lg overflow-hidden border shadow-sm">
                                        <Image src={campaign.imageUrl} alt="Generated Campaign Image" fill className="object-cover" />
                                    </div>
                                </CardContent>
                                <CardFooter>
                                     <Button onClick={() => handleDownload(campaign.imageUrl, 'hagaaty-promo-image.png')} variant="secondary">
                                        <Download className="mr-2 h-4 w-4" />
                                        تحميل الصورة
                                    </Button>
                                </CardFooter>
                            </Card>
                        )}
                         {campaign.videoUrl && (
                            <Card>
                                <CardHeader>
                                     <CardTitle className="flex items-center gap-2 text-lg">
                                        <Video className="h-5 w-5 text-rose-500" />
                                        فيديو الحملة (Reel/Short)
                                     </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="relative aspect-[9/16] w-full max-w-sm mx-auto rounded-lg overflow-hidden border shadow-sm">
                                       <video
                                            src={campaign.videoUrl}
                                            controls
                                            className="w-full h-full object-cover"
                                            playsInline
                                        />
                                    </div>
                                </CardContent>
                                <CardFooter>
                                     <Button onClick={() => handleDownload(campaign.videoUrl, 'hagaaty-promo-video.mp4')} variant="secondary">
                                        <Download className="mr-2 h-4 w-4" />
                                        تحميل الفيديو
                                    </Button>
                                </CardFooter>
                            </Card>
                        )}
                    </div>
                     <div className="space-y-6">
                        <Card className="bg-primary/5">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg"><Bot className="h-5 w-5 text-primary"/> استراتيجية الوكيل</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{campaign.strategy}</p>
                            </CardContent>
                        </Card>
                        <Card>
                             <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg"><Twitter className="h-5 w-5 text-sky-500"/> منشور X (تويتر)</CardTitle>
                             </CardHeader>
                             <CardContent className="space-y-4">
                                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{campaign.xPost}</p>
                             </CardContent>
                             <CardFooter className="flex gap-2">
                                <Button onClick={() => copyToClipboard(campaign.xPost, 'xPost')} variant="outline" size="sm">
                                    {copiedStates['xPost'] ? <Check className="ml-2 h-4 w-4" /> : <Copy className="ml-2 h-4 w-4" />}
                                    نسخ
                                </Button>
                                <Button onClick={() => handlePublish('X')} size="sm" disabled={isPublishing['xPost']}>
                                    {isPublishing['xPost'] ? <Loader2 className="ml-2 h-4 w-4 animate-spin"/> : <Send className="ml-2 h-4 w-4" />}
                                    نشر
                                </Button>
                             </CardFooter>
                        </Card>
                        <Card>
                             <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.494v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"/></svg>
                                    منشور فيسبوك / انستغرام
                                </CardTitle>
                             </CardHeader>
                             <CardContent className="space-y-4">
                                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{campaign.facebookPost}</p>
                             </CardContent>
                              <CardFooter className="flex gap-2">
                                <Button onClick={() => copyToClipboard(campaign.facebookPost, 'fbPost')} variant="outline" size="sm">
                                    {copiedStates['fbPost'] ? <Check className="ml-2 h-4 w-4" /> : <Copy className="ml-2 h-4 w-4" />}
                                    نسخ
                                </Button>
                                 <Button onClick={() => handlePublish('Facebook')} size="sm" disabled={isPublishing['fbPost']}>
                                    {isPublishing['fbPost'] ? <Loader2 className="ml-2 h-4 w-4 animate-spin"/> : <Send className="ml-2 h-4 w-4" />}
                                    نشر
                                </Button>
                             </CardFooter>
                        </Card>
                         <Card>
                             <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg"><Mail className="h-5 w-5 text-gray-500"/> نص رسالة مباشرة</CardTitle>
                             </CardHeader>
                             <CardContent className="space-y-4">
                                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{campaign.directMessage}</p>
                             </CardContent>
                             <CardFooter>
                                 <Button onClick={() => copyToClipboard(campaign.directMessage, 'dm')} variant="outline" size="sm">
                                    {copiedStates['dm'] ? <Check className="ml-2 h-4 w-4" /> : <Copy className="ml-2 h-4 w-4" />}
                                    نسخ الرسالة
                                </Button>
                             </CardFooter>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}

const CampaignSkeleton = () => (
    <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
            <Skeleton className="h-56 w-full" />
            <Skeleton className="h-[400px] w-full" />
        </div>
        <div className="space-y-6">
             <Skeleton className="h-32 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
        </div>
    </div>
);
