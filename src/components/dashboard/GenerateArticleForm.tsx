'use client';

import { generateBlogArticle } from "@/ai/flows/generate-blog-article";
import { categorizeAndTagArticle } from "@/ai/flows/categorize-and-tag-article";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Wand2 } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";

type GeneratedData = {
    article: string;
    category: string;
    tags: string[];
}

export default function GenerateArticleForm() {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedData, setGeneratedData] = useState<GeneratedData | null>(null);
    const [error, setError] = useState<string | null>(null);

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
                setGeneratedData({
                    article: articleResult.article,
                    category: metaResult.category,
                    tags: metaResult.tags
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
                        disabled={isLoading}
                    />
                    <p className="text-sm text-muted-foreground">
                        Be as specific or as general as you like.
                    </p>
                </div>
                <Button type="submit" disabled={isLoading || !prompt.trim()}>
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
                        <CardTitle className="font-headline text-2xl">Generated Article</CardTitle>
                        <div className="flex flex-wrap gap-2 pt-2">
                            <Badge variant="secondary">{generatedData.category}</Badge>
                            {generatedData.tags.map(tag => (
                                <Badge key={tag} variant="outline">{tag}</Badge>
                            ))}
                        </div>
                    </CardHeader>
                    <CardContent className="prose max-w-none">
                        {generatedData.article.split('\n').map((paragraph, index) => (
                            paragraph.trim() && <p key={index}>{paragraph}</p>
                        ))}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
