'use client';

import { generateVideo, type GenerateVideoOutput } from "@/ai/flows/generate-video-flow";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Wand2, Video, Download } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function GenerateVideoPage() {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedVideo, setGeneratedVideo] = useState<GenerateVideoOutput | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        setIsLoading(true);
        setGeneratedVideo(null);
        setError(null);

        try {
            const result = await generateVideo({ prompt });
            if (!result || !result.videoUrl) {
                throw new Error("فشل في توليد الفيديو.");
            }
            setGeneratedVideo(result);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "حدث خطأ غير معروف أثناء توليد الفيديو.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = () => {
        if (!generatedVideo) return;
        const link = document.createElement('a');
        link.href = generatedVideo.videoUrl;
        link.download = `hagaaty-video-${Date.now()}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Video className="h-8 w-8 text-primary"/>
                <h1 className="text-3xl font-bold font-headline">مولد الفيديو بالذكاء الاصطناعي</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>تحويل الأفكار إلى فيديوهات قصيرة</CardTitle>
                    <CardDescription>اكتب وصفًا لمقطع الفيديو الذي تتخيله، وسيقوم الذكاء الاصطناعي بإنشاء مقطع فيديو قصير (Reel/Short) احترافي لك في دقائق.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid w-full gap-2">
                            <Label htmlFor="prompt">وصف الفيديو (Prompt)</Label>
                            <Textarea
                                id="prompt"
                                placeholder="مثال: 'سيارة رياضية سريعة تسير على طريق جبلي عند غروب الشمس، تصوير سينمائي'"
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
                                    جاري تحويل فكرتك إلى فيديو... (قد يستغرق دقيقة)
                                </>
                            ) : (
                                <>
                                    <Wand2 className="mr-2 h-4 w-4" />
                                    توليد الفيديو
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
                        <p className="text-muted-foreground">يقوم الذكاء الاصطناعي بإخراج تحفتك السينمائية...</p>
                        <p className="text-sm text-muted-foreground/80 mt-2">قد تستغرق هذه العملية ما يصل إلى دقيقة واحدة. الرجاء عدم إغلاق الصفحة.</p>
                    </CardContent>
                </Card>
            )}

            {generatedVideo && !isLoading && (
                 <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">الفيديو المولد</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="relative aspect-[9/16] w-full max-w-sm mx-auto rounded-lg overflow-hidden border-2 border-primary/20 shadow-lg shadow-primary/10 bg-black">
                            <video
                                key={generatedVideo.videoUrl}
                                src={generatedVideo.videoUrl}
                                controls
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleDownload}>
                            <Download className="mr-2 h-4 w-4" />
                           تحميل الفيديو (MP4)
                        </Button>
                    </CardFooter>
                </Card>
            )}
        </div>
    );
}
