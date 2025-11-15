'use client';

import { generateTopicSuggestions, type GenerateTopicSuggestionsOutput } from "@/ai/flows/generate-topic-suggestions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Lightbulb, Loader2, RefreshCw, Wand2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';

export default function InsightsPage() {
    const [suggestions, setSuggestions] = useState<GenerateTopicSuggestionsOutput['suggestions']>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

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
    
    const handleGenerateClick = (title: string) => {
        const params = new URLSearchParams({ topic: title });
        router.push(`/dashboard/admin/generate?${params.toString()}`);
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
                                            onClick={() => handleGenerateClick(suggestion.title)}
                                            className="shrink-0"
                                        >
                                            <Wand2 className="mr-2 h-4 w-4"/>
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
