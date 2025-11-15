'use client';

import { generateBlogArticle } from "@/ai/flows/generate-blog-article";
import { categorizeAndTagArticle } from "@/ai/flows/categorize-and-tag-article";
import { generateImage } from "@/ai/flows/generate-image-flow";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, Wand2, Image as ImageIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "../ui/card";
import { Badge } from "../ui/badge";
import { useFirestore, useUser } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Input } from "../ui/input";
import Image from 'next/image';
import { Alert, AlertTitle, AlertDescription } from "../ui/alert";

type GeneratedData = {
    article: string;
    category: string;
    tags: string[];
    title: string;
    imageUrl?: string;
    imageHint?: string;
}

enum GenerationStep {
    Idle,
    GeneratingArticle,
    GeneratingMetadata,
    GeneratingImage,
    Done,
}

const stepMessages = {
    [GenerationStep.GeneratingArticle]: "جاري كتابة المقال...",
    [GenerationStep.GeneratingMetadata]: "جاري تصنيف المقال ووضع الوسوم...",
    [GenerationStep.GeneratingImage]: "جاري توليد صورة فريدة...",
};

type GenerateArticleFormProps = {
    prefilledTopic?: string | null;
}

export default function GenerateArticleForm({ prefilledTopic }: GenerateArticleFormProps) {
    const [prompt, setPrompt] = useState(prefilledTopic || '');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [step, setStep] = useState<GenerationStep>(GenerationStep.Idle);
    const [generatedData, setGeneratedData] = useState<GeneratedData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    
    const startGeneration = async (topic: string) => {
        if (!topic.trim()) return;

        setIsLoading(true);
        setGeneratedData(null);
        setError(null);

        try {
            // Step 1: Generate Article
            setStep(GenerationStep.GeneratingArticle);
            const articleResult = await generateBlogArticle({ prompt: topic });
            if (!articleResult || !articleResult.article) throw new Error("فشل في توليد محتوى المقال.");
            
            const firstLine = articleResult.article.split('\n')[0].replace(/#/g, '').trim();
            let data: GeneratedData = { 
                article: articleResult.article, 
                title: firstLine, 
                category: '', 
                tags: [] 
            };
            setGeneratedData(data); // Show article as it generates

            // Step 2: Generate Metadata
            setStep(GenerationStep.GeneratingMetadata);
            const metaResult = await categorizeAndTagArticle({ articleContent: articleResult.article });
            data = { ...data, category: metaResult.category, tags: metaResult.tags };
            setGeneratedData(data); // Update with metadata

            // Step 3: Generate Image
            setStep(GenerationStep.GeneratingImage);
            const imageResult = await generateImage({ prompt: data.title });
            data = { ...data, imageUrl: imageResult.imageUrl, imageHint: imageResult.imageHint };
            setGeneratedData(data); // Final update with image

            setStep(GenerationStep.Done);

        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "حدث خطأ غير معروف.");
            setStep(GenerationStep.Idle);
        } finally {
            setIsLoading(false);
        }
    };
    
    // Automatically start generation if a topic is pre-filled from URL
    useEffect(() => {
        if (prefilledTopic) {
            startGeneration(prefilledTopic);
        }
    }, [prefilledTopic]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        startGeneration(prompt);
    };
    
    const handleSave = async () => {
      if (!generatedData || !firestore || !user || !generatedData.imageUrl) return;
      setIsSaving(true);

      const slug = generatedData.title.toLowerCase().replace(/[^a-z0-9\u0621-\u064A]+/g, '-').replace(/(^-|-$)/g, '');

      try {
        await addDoc(collection(firestore, 'posts'), {
            title: generatedData.title,
            slug: slug,
            content: generatedData.article,
            excerpt: generatedData.article.substring(0, 150) + '...',
            category: generatedData.category,
            tags: generatedData.tags,
            author: {
                name: user.displayName || "AI Admin",
                avatarUrl: user.photoURL || 'https://picsum.photos/seed/avatar-placeholder/40/40'
            },
            imageUrl: generatedData.imageUrl,
            imageHint: generatedData.imageHint,
            date: serverTimestamp(),
        });
        toast({
            title: "تم حفظ المقال!",
            description: "تم نشر المقال الجديد في مدونتك.",
        });
        setGeneratedData(null);
        setPrompt('');
      } catch(e) {
          console.error("Error saving article: ", e);
          toast({
            variant: "destructive",
            title: "فشل الحفظ",
            description: "لم نتمكن من حفظ المقال في قاعدة البيانات.",
          });
      } finally {
        setIsSaving(false);
      }

    }

    return (
        <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid w-full gap-2">
                    <Label htmlFor="prompt">فكرة المقال</Label>
                    <Textarea
                        id="prompt"
                        placeholder="مثال: 'مستقبل الذكاء الاصطناعي في تطوير الويب'"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        rows={3}
                        disabled={isLoading || isSaving}
                    />
                    <p className="text-sm text-muted-foreground">
                        كن محددًا أو عامًا كما تريد. سيقوم الذكاء الاصطناعي بالباقي.
                    </p>
                </div>
                <Button type="submit" disabled={isLoading || isSaving || !prompt.trim()}>
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {stepMessages[step as keyof typeof stepMessages] || 'جاري التوليد...'}
                        </>
                    ) : (
                        <>
                            <Wand2 className="mr-2 h-4 w-4" />
                            توليد المقال
                        </>
                    )}
                </Button>
            </form>

            {error && !isLoading &&(
                <Alert variant="destructive">
                    <AlertTitle>فشل التوليد</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {generatedData && (
                 <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">مراجعة المقال المولد</CardTitle>
                        <CardDescription>راجع المحتوى الذي تم إنشاؤه بواسطة الذكاء الاصطناعي. يمكنك تحرير أي جزء قبل الحفظ.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {generatedData.imageUrl ? (
                           <div className="relative aspect-video w-full rounded-lg overflow-hidden border shadow-sm">
                               <Image src={generatedData.imageUrl} alt={generatedData.title} fill className="object-cover"/>
                           </div>
                        ) : (
                           <div className="flex flex-col justify-center items-center aspect-video w-full rounded-lg bg-muted text-muted-foreground">
                             <Loader2 className="h-10 w-10 animate-spin mb-2" />
                             <p>{stepMessages[GenerationStep.GeneratingImage]}</p>
                           </div>
                        )}
                        <div className="space-y-2">
                          <Label htmlFor="title">العنوان</Label>
                          <Input 
                              id="title" 
                              value={generatedData.title}
                              onChange={(e) => setGeneratedData({...generatedData, title: e.target.value})}
                              className="text-xl font-bold font-headline h-auto py-2"
                              disabled={isSaving}
                          />
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Label>الفئة:</Label>
                            <Badge variant="secondary">{generatedData.category || 'جاري التحديد...'}</Badge>
                        </div>
                         <div className="flex flex-wrap items-center gap-2">
                             <Label>الوسوم:</Label>
                            {generatedData.tags.length > 0 ? generatedData.tags.map(tag => (
                                <Badge key={tag} variant="outline">{tag}</Badge>
                            )) : <span className="text-sm text-muted-foreground">جاري التحديد...</span>}
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="content">المحتوى</Label>
                            <Textarea 
                                id="content"
                                value={generatedData.article}
                                onChange={(e) => setGeneratedData({...generatedData, article: e.target.value})}
                                rows={15}
                                className="leading-relaxed"
                                disabled={isSaving}
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleSave} disabled={isSaving || isLoading}>
                             {isSaving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    جاري الحفظ والنشر...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                   حفظ ونشر المقال
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </Card>
            )}
        </div>
    );
}
