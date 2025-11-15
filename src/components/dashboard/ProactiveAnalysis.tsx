'use client';

import { proactiveCampaignAnalysis } from "@/ai/flows/proactive-campaign-analysis";
import type { ProactiveCampaignAnalysisInput } from "@/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Lightbulb, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

type AdCampaign = {
    id: string;
    productName: string;
    performance: {
        impressions: number;
        clicks: number;
        ctr: number;
    }
};

type ProactiveAnalysisProps = {
    campaigns: AdCampaign[];
};

export default function ProactiveAnalysis({ campaigns }: ProactiveAnalysisProps) {
    const [insight, setInsight] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // We only want to run the analysis if there are at least two campaigns to compare.
        if (!campaigns || campaigns.length < 2) {
            setIsLoading(false);
            return;
        }

        const runAnalysis = async () => {
            setIsLoading(true);
            try {
                const analysisInput: ProactiveCampaignAnalysisInput = {
                    campaigns: campaigns.map(c => ({
                        id: c.id,
                        productName: c.productName,
                        clicks: c.performance.clicks,
                        impressions: c.performance.impressions,
                        ctr: c.performance.ctr,
                    }))
                };

                const result = await proactiveCampaignAnalysis(analysisInput);
                
                if (result && result.isActionable) {
                    setInsight(result.insight);
                } else {
                    setInsight(null); // No actionable insight to show
                }

            } catch (error) {
                console.error("Proactive analysis failed:", error);
                // Don't show an error to the user, just fail silently.
                setInsight(null);
            } finally {
                setIsLoading(false);
            }
        };

        runAnalysis();
    }, [campaigns]); // Rerun analysis if the campaigns data changes

    if (isLoading) {
        return <Skeleton className="h-24 w-full" />;
    }

    if (!insight) {
        // If there's no insight, we don't render anything.
        return null;
    }

    return (
        <Alert className="border-primary/30 bg-primary/5 text-primary-foreground animate-in fade-in-50">
            <Lightbulb className="h-5 w-5 text-primary" />
            <AlertTitle className="font-bold text-primary">رؤية جديدة من المدرب الذكي!</AlertTitle>
            <AlertDescription className="mt-2 text-foreground/80">
                {insight}
            </AlertDescription>
        </Alert>
    );
}
