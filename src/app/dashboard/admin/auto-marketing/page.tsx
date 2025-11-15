'use client';

import { generateMarketingContent, type GenerateMarketingContentOutput } from "@/ai/flows/generate-marketing-content";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Bot, Lightbulb, Loader2, Megaphone, Milestone, RefreshCw, Send, Twitter, BookCopy } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import PromotionalCampaignGenerator from "@/components/dashboard/PromotionalCampaignGenerator";

export default function AutoMarketingPage() {
    const [campaign, setCampaign] = useState<GenerateMarketingContentOutput | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPublishing, setIsPublishing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchMarketingCampaign = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await generateMarketingContent();
            setCampaign(result);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "An unknown error occurred while generating content.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMarketingCampaign();
    }, []);

    const handlePublish = () => {
        setIsPublishing(true);
        // Simulate publishing action
        setTimeout(() => {
            toast({
                title: "تم النشر (محاكاة)",
                description: "تم نشر المحتوى التسويقي بنجاح.",
            });
            setIsPublishing(false);
            // Fetch new campaign after publishing
            fetchMarketingCampaign();
        }, 1500);
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Megaphone className="h-8 w-8 text-primary" />
                    <h1 className="text-3xl font-bold font-headline">التسويق الآلي</h1>
                </div>
            </div>

            <Card>
                 <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                       <BookCopy className="h-6 w-6 text-primary"/>
                       <span>حملة ترويج ذاتي للمنصة</span>
                    </CardTitle>
                    <CardDescription>
                        أطلق وكيل الذكاء الاصطناعي لكتابة 5 مقالات دفعة واحدة عن مميزات المنصة لنشرها في المدونة وجذب المزيد من العملاء والمسوقين.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <PromotionalCampaignGenerator />
                </CardContent>
            </Card>


            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <Bot className="h-6 w-6 text-primary"/>
                            <span>وكيل التسويق للمحتوى الحالي</span>
                        </div>
                        <Button onClick={fetchMarketingCampaign} disabled={isLoading || isPublishing} variant="outline">
                            <RefreshCw className={`ml-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                            توليد حملة جديدة
                        </Button>
                    </CardTitle>
                    <CardDescription>
                        يقوم الذكاء الاصطناعي بتحليل أحدث مقال في مدونتك ويقترح حملة تسويقية كاملة له للوصول إلى جمهور أوسع.
                    </CardDescription>
                </CardHeader>
                <CardContent>
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
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-lg"><Milestone className="h-5 w-5 text-primary"/> المقال المستهدف</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <h3 className="font-semibold text-lg">{campaign.article.title}</h3>
                                        <p className="text-sm text-muted-foreground mt-1 mb-4">{campaign.article.excerpt}</p>
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/articles/${campaign.article.slug}`} target="_blank">
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
                                        <p className="text-sm text-muted-foreground">{campaign.strategy}</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                     <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-lg"><Lightbulb className="h-5 w-5 text-amber-500"/> أفكار الصور الأخرى</CardTitle>
                                     </CardHeader>
                                     <CardContent>
                                        <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                                           {campaign.imageIdeas.map((idea, index) => <li key={index}>{idea}</li>)}
                                        </ul>
                                     </CardContent>
                                </Card>
                            </div>
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
                                    </Card>
                                )}
                                <Card>
                                     <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-lg"><Twitter className="h-5 w-5 text-sky-500"/> منشور X (تويتر)</CardTitle>
                                     </CardHeader>
                                     <CardContent className="space-y-4">
                                        <p className="whitespace-pre-wrap">{campaign.socialPosts.xPost.text}</p>
                                        <div className="flex flex-wrap gap-1">
                                            {campaign.socialPosts.xPost.hashtags.map(tag => <span key={tag} className="text-sm text-primary font-semibold">{tag}</span>)}
                                        </div>
                                     </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}
                </CardContent>
                <CardFooter>
                    <Button onClick={handlePublish} disabled={isLoading || isPublishing || !campaign}>
                        {isPublishing ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="mr-2 h-4 w-4" />
                        )}
                        موافقة ونشر (محاكاة)
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

const CampaignSkeleton = () => (
    <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
        </div>
        <div className="space-y-6">
            <Skeleton className="h-56 w-full" />
            <Skeleton className="h-48 w-full" />
        </div>
    </div>
);
