
'use client';

import { generateImage, type GenerateImageOutput } from '@/ai/flows/generate-image-flow';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Wand2, Image as ImageIcon, Download } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import Image from 'next/image';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function GenerateImagePage() {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<GenerateImageOutput | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        setIsLoading(true);
        setGeneratedImage(null);
        setError(null);

        try {
            const result = await generateImage({ prompt });
            if (!result || !result.imageUrl) {
                throw new Error("فشل في توليد الصورة.");
            }
            setGeneratedImage(result);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "حدث خطأ غير معروف أثناء توليد الصورة.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = () => {
        if (!generatedImage) return;
        const link = document.createElement('a');
        link.href = generatedImage.imageUrl;
        link.download = `${generatedImage.imageHint.replace(' ', '_') || 'generated-image'}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <ImageIcon className="h-8 w-8 text-primary"/>
                <h1 className="text-3xl font-bold font-headline">مولد الصور بالذكاء الاصطناعي</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>تحويل الأفكار إلى صور</CardTitle>
                    <CardDescription>اكتب وصفًا للصورة التي تتخيلها، وسيقوم الذكاء الاصطناعي بإنشائها لك في ثوانٍ. أداة مثالية لمقالاتك ومنشوراتك.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid w-full gap-2">
                            <Label htmlFor="prompt">وصف الصورة (Prompt)</Label>
                            <Textarea
                                id="prompt"
                                placeholder="مثال: 'رائد فضاء يركب حصانًا على سطح المريخ، بأسلوب فني واقعي'"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                rows={3}
                                disabled={isLoading}
                                className="text-base"
                            />
                        </div>
                        <Button type="submit" disabled={isLoading || !prompt.trim()}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    جاري تحويل الخيال إلى حقيقة...
                                </>
                            ) : (
                                <>
                                    <Wand2 className="mr-2 h-4 w-4" />
                                    توليد الصورة
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {error && !isLoading &&(
                <Alert variant="destructive">
                    <AlertTitle>فشل التوليد</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {isLoading && (
                 <Card>
                    <CardContent className="p-6 flex flex-col justify-center items-center h-96">
                        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                        <p className="text-muted-foreground">يقوم الذكاء الاصطناعي برسم تحفتك الفنية...</p>
                    </CardContent>
                </Card>
            )}

            {generatedImage && !isLoading && (
                 <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">الصورة المولدة</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="relative aspect-video w-full rounded-lg overflow-hidden border-2 border-primary/20 shadow-lg shadow-primary/10">
                            <Image src={generatedImage.imageUrl} alt={generatedImage.imageHint} fill className="object-cover"/>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleDownload}>
                            <Download className="mr-2 h-4 w-4" />
                           تحميل الصورة
                        </Button>
                    </CardFooter>
                </Card>
            )}
        </div>
    );
}
