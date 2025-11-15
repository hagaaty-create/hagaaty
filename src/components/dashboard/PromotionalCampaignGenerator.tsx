'use client';

import { generatePromotionalArticles } from "@/ai/flows/generate-promotional-articles";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Wand2, CheckCircle, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { useRouter } from "next/navigation";


export default function PromotionalCampaignGenerator() {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<{ generatedCount: number; generatedTitles: string[] } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();
    const router = useRouter();


    const handleGenerate = async () => {
        setIsLoading(true);
        setResult(null);
        setError(null);
        toast({
            title: "🚀 جاري إطلاق حملة الترويج الذاتي...",
            description: "يقوم الذكاء الاصطناعي الآن بكتابة 5 مقالات. قد يستغرق هذا بعض الوقت.",
        });

        try {
            const response = await generatePromotionalArticles();
            setResult(response);
            toast({
                title: "✅ نجاح!",
                description: `تم توليد ونشر ${response.generatedCount} مقالات جديدة بنجاح في المدونة.`,
            });
            // Refresh the articles list page to show new content
            router.refresh();

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "حدث خطأ غير معروف أثناء إنشاء المقالات.";
            setError(errorMessage);
            toast({
                variant: 'destructive',
                title: "فشل إنشاء الحملة",
                description: errorMessage,
            });
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4">
             <Button onClick={handleGenerate} disabled={isLoading}>
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        الوكيل يعمل... (قد يستغرق الأمر دقيقة)
                    </>
                ) : (
                    <>
                        <Wand2 className="mr-2 h-4 w-4" />
                        إطلاق حملة (توليد 5 مقالات)
                    </>
                )}
            </Button>

            {error && (
                 <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>فشل العملية</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {result && (
                <Alert variant="default" className="border-green-500 text-green-700">
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle className="text-green-800">اكتملت الحملة بنجاح!</AlertTitle>
                    <AlertDescription>
                        <p>تم نشر {result.generatedCount} مقالات جديدة في مدونتك:</p>
                        <ul className="list-disc pl-5 mt-2 text-sm">
                            {result.generatedTitles.map((title, index) => (
                                <li key={index}>{title}</li>
                            ))}
                        </ul>
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}
