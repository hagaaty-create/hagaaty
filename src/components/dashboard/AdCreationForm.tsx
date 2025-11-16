'use client';

import { createAdCampaign } from "@/ai/flows/create-ad-campaign";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, Save, Wand2, Link as LinkIcon, Search, Phone, CheckCircle, Circle, Users, Eye, MousePointerClick } from "lucide-react";
import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../ui/card";
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { collection, serverTimestamp, doc, updateDoc, increment, getCountFromServer, FieldValue } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { addDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Slider } from "../ui/slider";


type AdCopy = {
    headline: string;
    body: string;
}

type GeneratedAd = {
    suggestionA: AdCopy;
    suggestionB: AdCopy;
}

type UserProfile = {
  id: string;
  displayName: string;
  email: string;
  balance?: number;
}

export default function AdCreationForm() {
    const [productName, setProductName] = useState('');
    const [productDescription, setProductDescription] = useState('');
    const [targetAudience, setTargetAudience] = useState('');
    const [websiteUrl, setWebsiteUrl] = useState('');
    const [keywords, setKeywords] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [budget, setBudget] = useState([2]);

    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [generatedAd, setGeneratedAd] = useState<GeneratedAd | null>(null);
    const [selectedAd, setSelectedAd] = useState<AdCopy | null>(null);
    const [error, setError] = useState<string | null>(null);

    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    const router = useRouter();
    
    const userProfileRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'users', user.uid);
    }, [user, firestore]);

    const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

    const hasSufficientBalance = useMemo(() => {
        return (userProfile?.balance ?? 0) >= budget[0];
    }, [userProfile, budget]);
    
    const estimatedPerformance = useMemo(() => {
        const selectedBudget = budget[0];
        const baseImpressions = 250 * selectedBudget; // e.g. 250 impressions per dollar
        const baseClicks = baseImpressions * 0.04; // avg 4% CTR
        
        return {
            impressions: `${(baseImpressions * 0.8).toFixed(0)} - ${(baseImpressions * 1.2).toFixed(0)}`,
            clicks: `${(baseClicks * 0.7).toFixed(0)} - ${(baseClicks * 1.3).toFixed(0)}`
        }
    }, [budget]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!productName.trim() || !productDescription.trim() || !targetAudience.trim() || !keywords.trim() || !websiteUrl.trim()) return;

        if (!hasSufficientBalance) {
            setError(`رصيدك غير كافٍ لإنشاء حملة إعلانية. التكلفة هي ${budget[0].toFixed(2)}$`);
            return;
        }

        setIsLoading(true);
        setGeneratedAd(null);
        setSelectedAd(null);
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
                setSelectedAd(result.suggestionA); // Default to suggestion A
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
        if (!selectedAd || !firestore || !user || !userProfileRef) return;
        setIsSaving(true);
        const adCost = budget[0];

        // Realistic performance simulation based on budget
        const impressions = Math.floor((Math.random() * (1.2 - 0.8) + 0.8) * (250 * adCost));
        const clicks = Math.min(Math.floor(impressions * 0.08), Math.floor(impressions * (Math.random() * (0.08 - 0.02) + 0.02)));
        const ctr = impressions > 0 ? clicks / impressions : 0;

        const campaignsCollection = collection(firestore, 'users', user.uid, 'campaigns');

        const snapshot = await getCountFromServer(campaignsCollection);
        if (snapshot.data().count === 0) {
            updateDocumentNonBlocking(userProfileRef, {
                achievements: FieldValue.arrayUnion({
                    id: 'ad_pioneer',
                    name: 'رائد الإعلانات',
                    awardedAt: serverTimestamp()
                })
            });
             toast({
                title: "🏆 إنجاز جديد!",
                description: "لقد حصلت على شارة 'رائد الإعلانات' لإنشاء أول حملة لك.",
            });
        }

        const newCampaignData = {
            productName,
            productDescription,
            targetAudience,
            websiteUrl,
            keywords: keywords.split(',').map(k => k.trim()),
            phoneNumber,
            ...selectedAd,
            budget: adCost,
            status: 'reviewing',
            createdAt: serverTimestamp(),
            performance: {
                impressions,
                clicks,
                ctr,
            }
        };

        
        const newCampaignRef = await addDocumentNonBlocking(campaignsCollection, newCampaignData);
        
        updateDocumentNonBlocking(userProfileRef, {
            balance: increment(-adCost)
        });

        toast({
            title: "تم إرسال الحملة للمراجعة!",
            description: `سيقوم الذكاء الاصطناعي بمراجعة حملتك. تم خصم ${adCost.toFixed(2)}$ من رصيدك.`,
        });
        
        router.push(`/dashboard/campaigns?newCampaignId=${newCampaignRef.id}`);
        router.refresh();
    }

    const canGenerate = useMemo(() => {
        return hasSufficientBalance && productName.trim() && productDescription.trim() && targetAudience.trim() && keywords.trim() && websiteUrl.trim();
    }, [hasSufficientBalance, productName, productDescription, targetAudience, keywords, websiteUrl]);

    return (
        <div className="space-y-6">
             {!hasSufficientBalance && userProfile && (
                <Alert variant="destructive">
                    <AlertTitle>رصيد غير كافٍ</AlertTitle>
                    <AlertDescription>
                        رصيدك الحالي هو ${userProfile?.balance?.toFixed(2) || '0.00'}. التكلفة المطلوبة لهذه الحملة هي ${budget[0].toFixed(2)}.
                    </AlertDescription>
                </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
                 <div className="grid w-full gap-2">
                    <Label htmlFor="budget">ميزانية الحملة</Label>
                    <div className="flex items-center gap-4">
                       <Slider
                           id="budget"
                           min={2}
                           max={100}
                           step={1}
                           value={budget}
                           onValueChange={setBudget}
                           disabled={isLoading || isSaving}
                       />
                       <div className="font-bold text-lg text-primary w-24 text-center border rounded-md p-2">
                           ${budget[0].toFixed(2)}
                       </div>
                    </div>
                </div>
                 <Card className="bg-muted/50">
                    <CardHeader>
                        <CardTitle className="text-base">التقديرات المتوقعة</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                            <Eye className="h-5 w-5 text-muted-foreground" />
                            <p className="font-bold text-lg">{estimatedPerformance.impressions}</p>
                            <p className="text-xs text-muted-foreground">مرة ظهور</p>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <MousePointerClick className="h-5 w-5 text-muted-foreground" />
                            <p className="font-bold text-lg">{estimatedPerformance.clicks}</p>
                            <p className="text-xs text-muted-foreground">نقرة</p>
                        </div>
                    </CardContent>
                </Card>

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
                        <CardTitle className="font-headline text-2xl">مقترحات الإعلان (A/B Test)</CardTitle>
                        <CardDescription>راجع نسختي الإعلان المقترحتين. اختر النسخة التي تفضلها ثم قم بحفظ الحملة.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-6">
                        
                        <Card 
                            className={cn("cursor-pointer transition-all", selectedAd === generatedAd.suggestionA ? "border-primary ring-2 ring-primary" : "hover:border-primary/50")}
                            onClick={() => setSelectedAd(generatedAd.suggestionA)}
                        >
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span>الاقتراح أ</span>
                                    {selectedAd === generatedAd.suggestionA ? <CheckCircle className="h-5 w-5 text-primary"/> : <Circle className="h-5 w-5 text-muted-foreground"/>}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-semibold mb-1 text-muted-foreground">العنوان</h4>
                                    <p className="rounded-md border bg-muted p-3 text-sm">{generatedAd.suggestionA.headline}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold mb-1 text-muted-foreground">النص</h4>
                                    <p className="rounded-md border bg-muted p-3 text-sm">{generatedAd.suggestionA.body}</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card 
                            className={cn("cursor-pointer transition-all", selectedAd === generatedAd.suggestionB ? "border-primary ring-2 ring-primary" : "hover:border-primary/50")}
                            onClick={() => setSelectedAd(generatedAd.suggestionB)}
                        >
                             <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span>الاقتراح ب</span>
                                    {selectedAd === generatedAd.suggestionB ? <CheckCircle className="h-5 w-5 text-primary"/> : <Circle className="h-5 w-5 text-muted-foreground"/>}
                                </CardTitle>
                            </CardHeader>
                           <CardContent className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-semibold mb-1 text-muted-foreground">العنوان</h4>
                                    <p className="rounded-md border bg-muted p-3 text-sm">{generatedAd.suggestionB.headline}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold mb-1 text-muted-foreground">النص</h4>
                                    <p className="rounded-md border bg-muted p-3 text-sm">{generatedAd.suggestionB.body}</p>
                                </div>
                            </CardContent>
                        </Card>

                    </CardContent>
                    <CardFooter>
                         <Button onClick={handleSave} disabled={isSaving || !selectedAd}>
                             {isSaving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    جاري الحفظ...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                   حفظ وإرسال للمراجعة (خصم ${budget[0].toFixed(2)})
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </Card>
            )}
        </div>
    );
}
