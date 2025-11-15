
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Key, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// This is a simplified, temporary test function.
// It directly uses the Google Generative AI REST API for a quick check.
async function testApiKey(apiKey: string): Promise<{ success: boolean; message: string }> {
    const TEST_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
    try {
        const response = await fetch(TEST_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Hello" }] }]
            }),
        });

        const data = await response.json();

        if (response.ok && data.candidates) {
            return { success: true, message: "الاتصال ناجح! المفتاح يعمل بشكل صحيح." };
        } else if (data.error) {
            return { success: false, message: `فشل الاتصال: ${data.error.message}` };
        } else {
            return { success: false, message: "فشل الاتصال. استجابة غير متوقعة من الخادم." };
        }
    } catch (error) {
        console.error("API Test Error:", error);
        return { success: false, message: "فشل الاتصال. تحقق من اتصالك بالإنترنت أو إعدادات الشبكة." };
    }
}


export default function TestApiPage() {
    const [apiKey, setApiKey] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const { toast } = useToast();

    const handleTestApiKey = async () => {
        if (!apiKey.trim()) {
            toast({
                variant: "destructive",
                title: "مطلوب مفتاح API",
                description: "الرجاء إدخال مفتاح Gemini API أولاً.",
            });
            return;
        }

        setIsLoading(true);
        setTestResult(null);
        const result = await testApiKey(apiKey);
        setTestResult(result);
        setIsLoading(false);
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Key className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold font-headline">اختبار مفتاح Gemini API</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>أداة التحقق من المفتاح</CardTitle>
                    <CardDescription>
                        استخدم هذه الصفحة للتحقق من أن مفتاح Gemini API الخاص بك يعمل بشكل صحيح.
                        احصل على مفتاحك من Google AI Studio وألصقه أدناه.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="api-key">مفتاح Gemini API</Label>
                        <Input
                            id="api-key"
                            type="password"
                            placeholder="AIzaSy..."
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                    <Button onClick={handleTestApiKey} disabled={isLoading}>
                        {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        اختبار المفتاح
                    </Button>
                </CardContent>
            </Card>

            {testResult && (
                <Alert variant={testResult.success ? "default" : "destructive"} className={testResult.success ? "border-green-500" : ""}>
                    {testResult.success ? (
                        <CheckCircle className={`h-4 w-4 ${testResult.success ? "!text-green-500" : ""}`} />
                    ) : (
                        <AlertTriangle className="h-4 w-4" />
                    )}
                    <AlertTitle>{testResult.success ? "نجاح" : "فشل"}</AlertTitle>
                    <AlertDescription>
                        {testResult.message}
                    </AlertDescription>
                </Alert>
            )}
             <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>ملاحظة هامة</AlertTitle>
                <AlertDescription>
                    هذه الصفحة مخصصة للاختبار فقط ولن تكون جزءًا من موقعك النهائي. بعد التأكد من عمل المفتاح، لا تنس إضافته إلى متغيرات البيئة في Vercel قبل النشر.
                </AlertDescription>
            </Alert>
        </div>
    );
}
