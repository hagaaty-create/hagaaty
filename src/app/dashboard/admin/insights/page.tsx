'use client';

import { generateTopicSuggestions, type GenerateTopicSuggestionsOutput } from "@/ai/flows/generate-topic-suggestions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Lightbulb, Loader2, RefreshCw, Wand2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { generatePromotionalArticles } from "@/ai/flows/generate-promotional-articles";

// We need a more comprehensive generation flow for a single article
// This is a simplified version of the logic in `generate-promotional-articles.ts`
import { generateBlogArticle } from '@/ai/flows/generate-blog-article';
import { categorizeAndTagArticle } from '@/ai/flows/categorize-and-tag-article';
import { generateImage } from '@/ai/flows/generate-image-flow';
import { useFirestore } from "@/firebase";
import { collection, serverTimestamp } from 'firebase/firestore';
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";


export default function InsightsPage() {
    const [suggestions, setSuggestions] = useState<GenerateTopicSuggestionsOutput['suggestions']>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState<Record<string, boolean>>({});
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const { toast } = useToast();
    const firestore = useFirestore();

    const fetchSuggestions = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await generateTopicSuggestions();
            setSuggestions(result.suggestions);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "An unknown error occurred while generating suggestions.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSuggestions();
    }, []);
    
    const handleGenerateClick = async (title: string, reason: string) => {
        if (!firestore) {
            toast({ variant: 'destructive', title: 'فشل الاتصال بقاعدة البيانات'});
            return;
        }

        setIsGenerating(prev => ({ ...prev, [title]: true }));
        toast({
            title: "بدأ توليد المقال...",
            description: `يقوم الذكاء الاصطناعي بكتابة مقال عن: "${title}"`,
        });

        try {
            // This is a simplified version of the logic in `generatePromotionalArticles`
            const articleResult = await generateBlogArticle({ prompt: `${title} - ${reason}` });
            const content = articleResult.article;

            const metaResult = await categorizeAndTagArticle({ articleContent: content });
            const imageResult = await generateImage({ prompt: title });
            
            const slug = title.toLowerCase().replace(/[^a-z0-9\u0621-\u064A]+/g, '-').replace(/(^-|-$)/g, '');

            const articleData = {
                title,
                slug,
                content,
                excerpt: content.substring(0, 150) + '...',
                category: metaResult.category,
                tags: metaResult.tags,
                author: {
                    name: "فريق حاجتي",
                    avatarUrl: 'https://picsum.photos/seed/hagaaty-logo/40/40'
                },
                imageUrl: imageResult.imageUrl,
                imageHint: imageResult.imageHint,
                date: serverTimestamp(),
            };

            const postsCollection = collection(firestore, 'posts');
            await addDocumentNonBlocking(postsCollection, articleData);

            toast({
                title: "✅ تم إنشاء المقال بنجاح!",
                description: `تم نشر "${title}" في المدونة.`,
            });
            
            // Refresh the page to remove the generated suggestion from the list (or show it as 'done')
            // For now, we just refresh. A more advanced implementation might update the state.
            router.refresh();


        } catch (err) {
            console.error("Failed to generate article from suggestion:", err);
            toast({
                variant: 'destructive',
                title: 'فشل توليد المقال',
                description: err instanceof Error ? err.message : 'حدث خطأ غير معروف.'
            });
        } finally {
            setIsGenerating(prev => ({ ...prev, [title]: false }));
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Lightbulb className="h-8 w-8 text-primary" />
                    <h1 className="text-3xl font-bold font-headline">رؤى المحتوى</h1>
                </div>
                 <Button onClick={fetchSuggestions} disabled={isLoading}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    تحديث
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>اقتراحات مواضيع مولدة بالذكاء الاصطناعي</CardTitle>
                    <CardDescription>
                        بناءً على الأسئلة الأخيرة للمستخدمين للمساعد الذكي، إليك بعض المواضيع الموصى بها لمقالات المدونة الجديدة.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading && (
                        <div className="space-y-6">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="space-y-2 p-4 rounded-lg bg-muted/50">
                                    <Skeleton className="h-6 w-3/4" />
                                    <Skeleton className="h-4 w-full" />
                                </div>
                            ))}
                        </div>
                    )}
                    {error && (
                        <div className="text-center py-12 text-destructive">
                            <p>فشل تحميل الاقتراحات.</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    )}
                    {!isLoading && !error && (
                         <div className="space-y-6">
                            {suggestions.map((suggestion, index) => (
                                <Card key={index} className="bg-muted/50 border-l-4 border-primary/50">
                                    <CardHeader className="flex flex-row items-start justify-between gap-4">
                                        <div>
                                            <CardTitle className="text-lg font-semibold flex items-center gap-3">
                                                <Wand2 className="h-5 w-5 text-primary" />
                                                {suggestion.title}
                                            </CardTitle>
                                            <CardDescription className="pt-2 pl-8">{suggestion.reason}</CardDescription>
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={() => handleGenerateClick(suggestion.title, suggestion.reason)}
                                            disabled={isGenerating[suggestion.title]}
                                            className="shrink-0"
                                        >
                                            {isGenerating[suggestion.title] ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                            ) : (
                                                <Wand2 className="mr-2 h-4 w-4"/>
                                            )}
                                            توليد المقال
                                        </Button>
                                    </CardHeader>
                                </Card>
                            ))}
                        </div>
                    )}
                     {!isLoading && !error && suggestions.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>لا توجد اقتراحات متاحة حتى الآن.</p>
                            <p>قد يكون هذا بسبب عدم وجود استفسارات حديثة من المستخدمين.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
