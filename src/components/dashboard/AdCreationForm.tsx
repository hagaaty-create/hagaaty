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
            setError(`رصيدك غير كافٍ لإنشاء إعلان. التكلفة هي ${AD_COST.toFixed(2)}$`);
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
        return hasSufficientBalance && productName.trim() && productDescription.trim() && targetAudience.trim()
    }, [hasSufficientBalance, productName, productDescription, targetAudience]);

    return (
        <div className="space-y-6">
             {!hasSufficientBalance && (
                <Alert variant="destructive">
                    <AlertTitle>رصيد غير كافٍ</AlertTitle>
                    <AlertDescription>
                        رصيدك الحالي هو ${userProfile?.balance?.toFixed(2) || '0.00'}. تحتاج إلى ${AD_COST.toFixed(2)} على الأقل لإنشاء حملة إعلانية جديدة. يرجى شحن رصيدك.
                    </AlertDescription>
                </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid w-full gap-2">
                    <Label htmlFor="productName">اسم المنتج/الخدمة</Label>
                    <Input
                        id="productName"
                        placeholder="مثال: 'منصة حاجتي للذكاء الاصطناعي'"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        disabled={isLoading || isSaving}
                    />
                </div>
                <div className="grid w-full gap-2">
                    <Label htmlFor="productDescription">وصف المنتج/الخدمة</Label>
                    <Textarea
                        id="productDescription"
                        placeholder="مثال: 'منصة مدعومة بالذكاء الاصطناعي لأتمتة الحملات الإعلانية وتحسين محركات البحث.'"
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
                <Button type="submit" disabled={isLoading || isSaving || !canGenerate}>
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            جاري الإنشاء...
                        </>
                    ) : (
                        <>
                            <Wand2 className="mr-2 h-4 w-4" />
                            إنشاء إعلان
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
                        <CardTitle className="font-headline text-2xl">نسخة الإعلان المُولَّدة</CardTitle>
                        <CardDescription>راجع نسخة الإعلان التي تم إنشاؤها بواسطة الذكاء الاصطناعي أدناه. يمكنك نسخها أو حفظ الحملة لتفعيلها.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label className="text-sm font-semibold">العنوان الرئيسي</Label>
                            <div className="prose prose-sm max-w-none rounded-md border bg-muted p-3 mt-1">
                                <p>{generatedAd.headline}</p>
                            </div>
                        </div>
                         <div>
                            <Label className="text-sm font-semibold">النص الأساسي</Label>
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
                                   حفظ الحملة وخصم ${AD_COST.toFixed(2)}
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </Card>
            )}
        </div>
    );
}
