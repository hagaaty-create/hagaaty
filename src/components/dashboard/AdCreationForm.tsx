'use client';

import { createAdCampaign } from "@/ai/flows/create-ad-campaign";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, Wand2 } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

type GeneratedAd = {
    headline: string;
    body: string;
}

export default function AdCreationForm() {
    const [productName, setProductName] = useState('');
    const [productDescription, setProductDescription] = useState('');
    const [targetAudience, setTargetAudience] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedAd, setGeneratedAd] = useState<GeneratedAd | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!productName.trim() || !productDescription.trim() || !targetAudience.trim()) return;

        setIsLoading(true);
        setGeneratedAd(null);
        setError(null);

        try {
            const result = await createAdCampaign({ 
                productName, 
                productDescription, 
                targetAudience 
            });
            if (result) {
                setGeneratedAd(result);
            } else {
                 throw new Error("Failed to generate ad campaign.");
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
                    <Label htmlFor="productName">Product/Service Name</Label>
                    <Input
                        id="productName"
                        placeholder="e.g., 'Hagaaty AI Platform'"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        disabled={isLoading}
                    />
                </div>
                <div className="grid w-full gap-2">
                    <Label htmlFor="productDescription">Product/Service Description</Label>
                    <Textarea
                        id="productDescription"
                        placeholder="e.g., 'An AI-powered platform to automate advertising campaigns and SEO.'"
                        value={productDescription}
                        onChange={(e) => setProductDescription(e.target.value)}
                        rows={3}
                        disabled={isLoading}
                    />
                </div>
                 <div className="grid w-full gap-2">
                    <Label htmlFor="targetAudience">Target Audience</Label>
                    <Input
                        id="targetAudience"
                        placeholder="e.g., 'Small business owners and digital marketers in Egypt'"
                        value={targetAudience}
                        onChange={(e) => setTargetAudience(e.target.value)}
                        disabled={isLoading}
                    />
                </div>
                <Button type="submit" disabled={isLoading || !productName.trim() || !productDescription.trim() || !targetAudience.trim()}>
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating Ad...
                        </>
                    ) : (
                        <>
                            <Wand2 className="mr-2 h-4 w-4" />
                            Generate Ad
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

            {generatedAd && (
                 <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">Generated Ad Copy</CardTitle>
                        <CardDescription>Review the AI-generated ad copy below. You can copy it and use it in your campaigns.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label className="text-sm font-semibold">Headline</Label>
                            <div className="prose prose-sm max-w-none rounded-md border bg-muted p-3 mt-1">
                                <p>{generatedAd.headline}</p>
                            </div>
                        </div>
                         <div>
                            <Label className="text-sm font-semibold">Body</Label>
                            <div className="prose prose-sm max-w-none rounded-md border bg-muted p-3 mt-1">
                                <p>{generatedAd.body}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
