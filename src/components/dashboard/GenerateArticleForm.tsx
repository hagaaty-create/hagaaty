'use client';

import { generateBlogArticle } from "@/ai/flows/generate-blog-article";
import { categorizeAndTagArticle } from "@/ai/flows/categorize-and-tag-article";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, Wand2 } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "../ui/card";
import { Badge } from "../ui/badge";
import { useFirestore, useUser } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Input } from "../ui/input";
import { PlaceHolderImages } from "@/lib/placeholder-images";

type GeneratedData = {
    article: string;
    category: string;
    tags: string[];
    title: string;
}

export default function GenerateArticleForm() {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [generatedData, setGeneratedData] = useState<GeneratedData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        setIsLoading(true);
        setGeneratedData(null);
        setError(null);

        try {
            const articleResult = await generateBlogArticle({ prompt });
            if (articleResult && articleResult.article) {
                const metaResult = await categorizeAndTagArticle({ articleContent: articleResult.article });
                // Simple title extraction (first line)
                const firstLine = articleResult.article.split('\n')[0];
                setGeneratedData({
                    article: articleResult.article,
                    category: metaResult.category,
                    tags: metaResult.tags,
                    title: firstLine.replace(/#/g, '').trim()
                });
            } else {
                 throw new Error("Failed to generate article content.");
            }
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "An unknown error occurred.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSave = async () => {
      if (!generatedData || !firestore || !user) return;
      setIsSaving(true);

      const slug = generatedData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const randomImage = PlaceHolderImages[Math.floor(Math.random() * PlaceHolderImages.length)];


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
                avatarUrl: user.photoURL || PlaceHolderImages.find(p => p.id === '7')?.imageUrl || 'https://picsum.photos/seed/avatar-placeholder/40/40'
            },
            imageUrl: randomImage.imageUrl,
            imageHint: randomImage.imageHint,
            date: serverTimestamp(),
        });
        toast({
            title: "Article Saved!",
            description: "The new article has been published to your blog.",
        });
        setGeneratedData(null);
        setPrompt('');
      } catch(e) {
          console.error("Error saving article: ", e);
          toast({
            variant: "destructive",
            title: "Saving failed",
            description: "Could not save the article to the database.",
          });
      } finally {
        setIsSaving(false);
      }

    }

    return (
        <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid w-full gap-2">
                    <Label htmlFor="prompt">Article Prompt</Label>
                    <Textarea
                        id="prompt"
                        placeholder="e.g., 'The future of AI in web development'"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        rows={3}
                        disabled={isLoading || isSaving}
                    />
                    <p className="text-sm text-muted-foreground">
                        Be as specific or as general as you like.
                    </p>
                </div>
                <Button type="submit" disabled={isLoading || isSaving || !prompt.trim()}>
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Wand2 className="mr-2 h-4 w-4" />
                            Generate Article
                        </>
                    )}
                </Button>
            </form>

            {error && (
                <Card className="bg-destructive/10 border-destructive">
                    <CardHeader>
                        <CardTitle className="text-destructive">Generation Failed</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{error}</p>
                    </CardContent>
                </Card>
            )}

            {generatedData && (
                 <Card>
                    <CardHeader>
                        <Label htmlFor="title">Title</Label>
                        <Input 
                            id="title" 
                            value={generatedData.title}
                            onChange={(e) => setGeneratedData({...generatedData, title: e.target.value})}
                            className="text-2xl font-bold font-headline"
                        />
                        <div className="flex flex-wrap gap-2 pt-2">
                            <Badge variant="secondary">{generatedData.category}</Badge>
                            {generatedData.tags.map(tag => (
                                <Badge key={tag} variant="outline">{tag}</Badge>
                            ))}
                        </div>
                    </CardHeader>
                    <CardContent className="prose max-w-none">
                        <Textarea 
                            value={generatedData.article}
                            onChange={(e) => setGeneratedData({...generatedData, article: e.target.value})}
                            rows={15}
                            className="prose"
                        />
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleSave} disabled={isSaving}>
                             {isSaving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                   Save and Publish
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </Card>
            )}
        </div>
    );
}
