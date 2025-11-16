'use client';

import { analyzeCampaignPerformance } from "@/ai/flows/analyze-campaign-performance";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Bot, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { Timestamp } from "firebase/firestore";

type AdCampaign = {
    id: string;
    performance: {
        impressions: number;
        clicks: number;
    },
    productName: string;
};

type CampaignPerformanceAnalysisProps = {
    campaign: AdCampaign;
};

export default function CampaignPerformanceAnalysis({ campaign }: CampaignPerformanceAnalysisProps) {
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleAnalysis = async () => {
        setIsLoading(true);
        try {
            const result = await analyzeCampaignPerformance({
                productName: campaign.productName,
                impressions: campaign.performance.impressions,
                clicks: campaign.performance.clicks,
            });
            setAnalysis(result.analysis);
        } catch (error) {
            console.error("Failed to analyze campaign performance:", error);
            toast({
                variant: 'destructive',
                title: "فشل التحليل",
                description: "لم نتمكن من تحليل أداء الحملة حاليًا."
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (analysis) {
        return (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                <p>{analysis}</p>
            </div>
        );
    }

    return (
        <Button onClick={handleAnalysis} disabled={isLoading} variant="outline" size="sm">
            {isLoading ? (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            ) : (
                <Bot className="ml-2 h-4 w-4" />
            )}
            تحليل الآن
        </Button>
    );
}
