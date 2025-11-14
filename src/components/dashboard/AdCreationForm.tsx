'use client';

import { createAdCampaign } from "@/ai/flows/create-ad-campaign";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, Save, Wand2, Link as LinkIcon, Search, Phone } from "lucide-react";
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

const AD_COST = 20.00;


export default function AdCreationForm() {
    const [productName, setProductName] = useState('');
    const [productDescription, setProductDescription] = useState('');
    const [targetAudience, setTargetAudience] = useState('');
    const [websiteUrl, setWebsiteUrl] = useState('');
    const [keywords, setKeywords] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');

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
        if (!productName.trim() || !productDescription.trim() || !targetAudience.trim() || !keywords.trim() || !websiteUrl.trim()) return;

        if (!hasSufficientBalance) {
            setError(`رصيدك غير كافٍ لإنشاء حملة إعلانية. التكلفة هي ${AD_COST.toFixed(2)}$`);
            return;
        }

        setIsLoading(true);
        setGeneratedAd(null);
        setError(null);

        try {
            const result = await createAdCampaign({ 
                productName, 
                productDescription, 
                targetAudience,
                keywords,
                websiteUrl,
                adType: phoneNumber ? 'call' : 'website_traffic'
            });
            if (result) {
                setGeneratedAd(result);
            } else {
                 throw new Error("فشل في إنشاء الحملة الإعلانية.");
            }
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "حدث خطأ غير معروف.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSave = async () => {
        if (!generatedAd || !firestore || !user || !userProfileRef) return;
        setIsSaving(true);

        // Generate simulated performance data
        const impressions = Math.floor(Math.random() * (10000 - 1000 + 1)) + 1000;
        const clicks = Math.floor(impressions * (Math.random() * (0.05 - 0.01) + 0.01));
        const ctr = clicks / impressions;

        try {
            // First, save the campaign
            await addDoc(collection(firestore, 'users', user.uid, 'campaigns'), {
                productName,
                productDescription,
                targetAudience,
                websiteUrl,
                keywords: keywords.split(',').map(k => k.trim()),
                phoneNumber,
                ...generatedAd,
                status: 'draft',
                createdAt: serverTimestamp(),
                performance: {
                    impressions,
                    clicks,
                    ctr,
                }
            });

            // Then, deduct the cost from the user's balance
            await updateDoc(userProfileRef, {
                balance: increment(-AD_COST)
            });

            toast({
                title: "تم حفظ الحملة!",
                description: `تم حفظ حملتك الإعلانية الجديدة. تم خصم ${AD_COST.toFixed(2)}$ من رصيدك.`,
            });
            setGeneratedAd(null); // Clear the form after saving
        } catch(e) {
            console.error("Error saving campaign: ", e);
            toast({
              variant: "destructive",
              title: "فشل الحفظ",
              description: "لم نتمكن من حفظ الحملة في قاعدة البيانات.",
            });
        } finally {
            setIsSaving(false);
        }
    }

    const canGenerate = useMemo(() => {
        return hasSufficientBalance && productName.trim() && productDescription.trim() && targetAudience.trim() && keywords.trim() && websiteUrl.trim();
    }, [hasSufficientBalance, productName, productDescription, targetAudience, keywords, websiteUrl]);

    return (
        <div className="space-y-6">
             {!hasSufficientBalance && (
                <Alert variant="destructive">
                    <AlertTitle>رصيد غير كافٍ</AlertTitle>
                    <AlertDescription>
                        رصيدك الحالي هو ${userProfile?.balance?.toFixed(2) || '0.00'}. تحتاج إلى ${AD_COST.toFixed(2)} على الأقل لإنشاء حملة إعلانية جديدة.
                    </AlertDescription>
                </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="grid w-full gap-2">
                        <Label htmlFor="productName">عنوان الإعلان الرئيسي</Label>
                        <Input
                            id="productName"
                            placeholder="مثال: 'منصة حاجتي للذكاء الاصطناعي'"
                            value={productName}
                            onChange={(e) => setProductName(e.target.value)}
                            disabled={isLoading || isSaving}
                        />
                    </div>
                     <div className="grid w-full gap-2">
                        <Label htmlFor="websiteUrl" className="flex items-center gap-2"><LinkIcon size={14}/> رابط الموقع الإلكتروني</Label>
                        <Input
                            id="websiteUrl"
                            type="url"
                            placeholder="https://example.com"
                            value={websiteUrl}
                            onChange={(e) => setWebsiteUrl(e.target.value)}
                            disabled={isLoading || isSaving}
                        />
                    </div>
                </div>
                <div className="grid w-full gap-2">
                    <Label htmlFor="productDescription">نص الإعلان (الوصف)</Label>
                    <Textarea
                        id="productDescription"
                        placeholder="صف منتجك أو خدمتك بشكل جذاب..."
                        value={productDescription}
                        onChange={(e) => setProductDescription(e.target.value)}
                        rows={3}
                        disabled={isLoading || isSaving}
                    />
                </div>
                 <div className="grid w-full gap-2">
                    <Label htmlFor="targetAudience">الجمهور المستهدف</Label>
                    <Input
                        id="targetAudience"
                        placeholder="مثال: 'أصحاب الأعمال الصغيرة والمسوقون الرقميون في مصر'"
                        value={targetAudience}
                        onChange={(e) => setTargetAudience(e.target.value)}
                        disabled={isLoading || isSaving}
                    />
                </div>
                <div className="grid w-full gap-2">
                    <Label htmlFor="keywords" className="flex items-center gap-2"><Search size={14}/> كلمات البحث الرئيسية (مفصولة بفاصلة)</Label>
                    <Input
                        id="keywords"
                        placeholder="ذكاء اصطناعي, تسويق رقمي, إعلانات جوجل"
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                        disabled={isLoading || isSaving}
                    />
                </div>
                 <div className="grid w-full gap-2">
                    <Label htmlFor="phoneNumber" className="flex items-center gap-2"><Phone size={14}/> رقم الهاتف (اختياري لإعلانات الاتصال)</Label>
                    <Input
                        id="phoneNumber"
                        type="tel"
                        dir="ltr"
                        placeholder="+201234567890"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        disabled={isLoading || isSaving}
                    />
                </div>
                <Button type="submit" disabled={isLoading || isSaving || !canGenerate} className="w-full md:w-auto">
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            جاري إنشاء نسخة الإعلان...
                        </>
                    ) : (
                        <>
                            <Wand2 className="mr-2 h-4 w-4" />
                            إنشاء الإعلان بالذكاء الاصطناعي
                        </>
                    )}
                </Button>
            </form>

            {error && !isLoading &&(
                <Card className="bg-destructive/10 border-destructive">
                    <CardHeader>
                        <CardTitle className="text-destructive">فشل الإنشاء</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{error}</p>
                    </CardContent>
                </Card>
            )}

            {generatedAd && (
                 <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">مقترح الإعلان</CardTitle>
                        <CardDescription>راجع نسخة الإعلان التي تم إنشاؤها. يمكنك تعديلها أو إطلاق الحملة مباشرة.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label className="text-sm font-semibold">العنوان الرئيسي المقترح</Label>
                            <div className="prose prose-sm max-w-none rounded-md border bg-muted p-3 mt-1">
                                <p>{generatedAd.headline}</p>
                            </div>
                        </div>
                         <div>
                            <Label className="text-sm font-semibold">النص الأساسي المقترح</Label>
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
                                    جاري الحفظ...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                   حفظ وإطلاق الحملة (خصم ${AD_COST.toFixed(2)})
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </Card>
            )}
        </div>
    );
}
