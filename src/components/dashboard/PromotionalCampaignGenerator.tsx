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
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();
    const router = useRouter();


    const handleGenerate = async () => {
        setIsLoading(true);
        setIsSubmitted(false);
        setError(null);

        try {
            await generatePromotionalArticles();
            setIsSubmitted(true);
            toast({
                title: "✅ تم إطلاق الحملة بنجاح!",
                description: "الوكيل يعمل الآن في الخلفية. سيتم نشر المقالات في مدونتك خلال الدقائق القليلة القادمة.",
            });
            // Refresh the articles list page after a delay to allow content to be generated
            setTimeout(() => {
                router.refresh();
            }, 5000); // 5 seconds delay before refreshing

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "حدث خطأ غير معروف أثناء بدء إنشاء المقالات.";
            setError(errorMessage);
            toast({
                variant: 'destructive',
                title: "فشل إطلاق الحملة",
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
                        جاري إطلاق الوكيل...
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

            {isSubmitted && !isLoading && (
                <Alert variant="default" className="border-green-500 text-green-700">
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle className="text-green-800">الوكيل يعمل الآن!</AlertTitle>
                    <AlertDescription>
                        <p>بدأ الذكاء الاصطناعي في كتابة ونشر 5 مقالات جديدة. يمكنك متابعة ظهورها في <a href="/blog" target="_blank" className="underline font-bold">صفحة المدونة</a> خلال لحظات.</p>
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}
