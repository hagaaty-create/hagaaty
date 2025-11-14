'use client';

import { createAdCampaign } from "@/ai/flows/create-ad-campaign";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, Save, Wand2 } from "lucide-react";
import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../ui/card";
import { useFirestore, useUser, useDoc } from "@/firebase";
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";


type GeneratedAd = {
    headline: string;
    body: string;
}

type UserProfile = {
  id: string;
  displayName: string;
  email: string;
  balance?: number;
}

const AD_COST = 1.00;


export default function AdCreationForm() {
    const [productName, setProductName] = useState('');
    const [productDescription, setProductDescription] = useState('');
    const [targetAudience, setTargetAudience] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [generatedAd, setGeneratedAd] = useState<GeneratedAd | null>(null);
    const [error, setError] = useState<string | null>(null);

    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    
    const userProfileRef = useMemo(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'users', user.uid);
    }, [user, firestore]);

    const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

    const hasSufficientBalance = useMemo(() => {
        return (userProfile?.balance ?? 0) >= AD_COST;
    }, [userProfile]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!productName.trim() || !productDescription.trim() || !targetAudience.trim()) return;

        if (!hasSufficientBalance) {
            setError(`Your balance is too low to generate an ad. The cost is $${AD_COST.toFixed(2)}.`);
            return;
        }

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
    
    const handleSave = async () => {
        if (!generatedAd || !firestore || !user || !userProfileRef) return;
        setIsSaving(true);
        try {
            // First, save the campaign
            await addDoc(collection(firestore, 'users', user.uid, 'campaigns'), {
                productName,
                productDescription,
                targetAudience,
                ...generatedAd,
                status: 'draft',
                createdAt: serverTimestamp(),
            });

            // Then, deduct the cost from the user's balance
            await updateDoc(userProfileRef, {
                balance: increment(-AD_COST)
            });

            toast({
                title: "Campaign Saved!",
                description: `Your new ad campaign has been saved. $${AD_COST.toFixed(2)} has been deducted from your balance.`,
            });
            setGeneratedAd(null); // Clear the form after saving
        } catch(e) {
            console.error("Error saving campaign: ", e);
            toast({
              variant: "destructive",
              title: "Saving failed",
              description: "Could not save the campaign to the database.",
            });
        } finally {
            setIsSaving(false);
        }
    }

    const canGenerate = useMemo(() => {
        return hasSufficientBalance && productName.trim() && productDescription.trim() && targetAudience.trim()
    }, [hasSufficientBalance, productName, productDescription, targetAudience]);

    return (
        <div className="space-y-6">
             {!hasSufficientBalance && (
                <Alert variant="destructive">
                    <AlertTitle>Insufficient Balance</AlertTitle>
                    <AlertDescription>
                        Your current balance is ${userProfile?.balance?.toFixed(2) || '0.00'}. You need at least ${AD_COST.toFixed(2)} to create a new ad campaign. Please top up your balance.
                    </AlertDescription>
                </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid w-full gap-2">
                    <Label htmlFor="productName">Product/Service Name</Label>
                    <Input
                        id="productName"
                        placeholder="e.g., 'Hagaaty AI Platform'"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        disabled={isLoading || isSaving}
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
                        disabled={isLoading || isSaving}
                    />
                </div>
                 <div className="grid w-full gap-2">
                    <Label htmlFor="targetAudience">Target Audience</Label>
                    <Input
                        id="targetAudience"
                        placeholder="e.g., 'Small business owners and digital marketers in Egypt'"
                        value={targetAudience}
                        onChange={(e) => setTargetAudience(e.target.value)}
                        disabled={isLoading || isSaving}
                    />
                </div>
                <Button type="submit" disabled={isLoading || isSaving || !canGenerate}>
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

            {error && !isLoading &&(
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
                        <CardDescription>Review the AI-generated ad copy below. You can copy it or save the campaign to activate it.</CardDescription>
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
                                   Save Campaign & Deduct ${AD_COST.toFixed(2)}
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </Card>
            )}
        </div>
    );
}
