
'use client';

import { analyzeArticleSeo } from "@/ai/flows/analyze-article-seo";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Bot, Loader2, Sparkles, Wand2 } from "lucide-react";
import { useState } from "react";
import type { Post } from "@/types";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import Link from "next/link";
import { useRouter } from "next/navigation";

type SeoAnalysisProps = {
    article: Post;
};

export default function SeoAnalysis({ article }: SeoAnalysisProps) {
    const [analysis, setAnalysis] = useState<{ suggestedTitle: string, reason: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const handleAnalysis = async () => {
        setIsLoading(true);
        try {
            const result = await analyzeArticleSeo({
                title: article.title,
                content: article.content.substring(0, 200),
            });
            setAnalysis(result);
        } catch (error) {
            console.error("Failed to analyze SEO:", error);
            toast({
                variant: 'destructive',
                title: "فشل التحليل",
                description: "لم نتمكن من تحليل المقال حاليًا."
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    if (analysis) {
        return (
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
                        <Sparkles className="mr-2 h-4 w-4" />
                        عرض الاقتراح
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <h4 className="font-medium leading-none">اقتراح SEO</h4>
                            <p className="text-sm text-muted-foreground">
                                {analysis.reason}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-semibold">العنوان المقترح:</p>
                             <p className="text-sm p-2 bg-muted rounded-md">{analysis.suggestedTitle}</p>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        );
    }

    return (
        <Button onClick={handleAnalysis} disabled={isLoading} variant="ghost" size="icon">
            {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <Bot className="h-4 w-4" />
            )}
        </Button>
    );
}
