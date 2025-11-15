'use client';

import { useDoc, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Landmark, Loader2, Send, CheckCircle, Wallet, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { requestWithdrawal } from "@/ai/flows/request-withdrawal";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


type UserProfile = {
  id: string;
  displayName: string;
  email: string;
  referralEarnings?: number;
}

const withdrawalMethods = [
    { value: "vodafone_cash", label: "فودافون كاش", detailPlaceholder: "010xxxxxxxx" },
    { value: "instapay", label: "InstaPay", detailPlaceholder: "username@instapay" },
    { value: "binance_pay", label: "Binance Pay", detailPlaceholder: "Pay ID or Email" },
];

const MIN_WITHDRAWAL = 10; // Minimum withdrawal amount in dollars

export default function WithdrawPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState(withdrawalMethods[0].value);
    const [details, setDetails] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const userProfileRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'users', user.uid);
    }, [user, firestore]);

    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

    const referralEarnings = userProfile?.referralEarnings || 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const withdrawalAmount = parseFloat(amount);

        if (!user || !userProfile) return;
        if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
            toast({ variant: 'destructive', title: 'مبلغ غير صالح', description: 'يرجى إدخال مبلغ سحب صحيح.' });
            return;
        }
        if (withdrawalAmount < MIN_WITHDRAWAL) {
             toast({ variant: 'destructive', title: 'الحد الأدنى للسحب', description: `الحد الأدنى للسحب هو ${MIN_WITHDRAWAL}$.` });
            return;
        }
        if (withdrawalAmount > referralEarnings) {
             toast({ variant: 'destructive', title: 'رصيد غير كافٍ', description: 'المبلغ المطلوب أكبر من رصيد أرباحك.' });
            return;
        }
        if (!details.trim()) {
            toast({ variant: 'destructive', title: 'بيانات ناقصة', description: 'يرجى إدخال تفاصيل طريقة الدفع.' });
            return;
        }
        
        setIsLoading(true);
        try {
            await requestWithdrawal({
                userName: userProfile.displayName,
                userEmail: userProfile.email,
                amount: withdrawalAmount,
                method: withdrawalMethods.find(m => m.value === method)?.label || method,
                details: details,
            });
            setIsSubmitted(true);
             toast({
                title: '✅ تم إرسال طلبك بنجاح',
                description: 'سيقوم فريقنا بمراجعة طلبك وتحويل المبلغ خلال 24 ساعة.',
            });
        } catch (error) {
            console.error("Failed to submit withdrawal request:", error);
            toast({ variant: 'destructive', title: 'فشل إرسال الطلب', description: 'حدث خطأ ما، يرجى المحاولة مرة أخرى.' });
        } finally {
            setIsLoading(false);
        }
    };
    
    const selectedMethodDetails = withdrawalMethods.find(m => m.value === method);

    if (isSubmitted) {
        return (
            <div className="space-y-8">
                <div className="flex items-center gap-4">
                    <Landmark className="h-8 w-8 text-primary" />
                    <h1 className="text-3xl font-bold font-headline">سحب الأرباح</h1>
                </div>
                 <Card className="max-w-2xl mx-auto text-center py-16 px-6 border-green-500 bg-green-500/5">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6"/>
                    <CardTitle className="text-2xl font-headline">تم استلام طلبك بنجاح!</CardTitle>
                    <CardDescription className="mt-4 text-base">
                        لقد أرسلنا طلبك إلى الفريق المالي. سيتم مراجعته وتحويل المبلغ إلى حسابك خلال 24 ساعة عمل.
                    </CardDescription>
                </Card>
            </div>
        );
    }


    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Landmark className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold font-headline">سحب الأرباح</h1>
            </div>

            <div className="grid md:grid-cols-3 gap-8 items-start">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>تقديم طلب سحب</CardTitle>
                        <CardDescription>
                            اطلب سحب أرباحك من التسويق الشبكي. الحد الأدنى للسحب هو ${MIN_WITHDRAWAL}$.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="amount">المبلغ (بالدولار)</Label>
                                <Input 
                                    id="amount" 
                                    type="number" 
                                    placeholder={`مثال: ${MIN_WITHDRAWAL}`}
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    disabled={isLoading}
                                    required
                                />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="method">طريقة الدفع</Label>
                                <Select value={method} onValueChange={setMethod} disabled={isLoading}>
                                    <SelectTrigger id="method">
                                        <SelectValue placeholder="اختر طريقة الدفع..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {withdrawalMethods.map(m => (
                                            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="details">تفاصيل الدفع</Label>
                                <Input 
                                    id="details" 
                                    placeholder={selectedMethodDetails?.detailPlaceholder || 'أدخل تفاصيل الدفع'}
                                    value={details}
                                    onChange={(e) => setDetails(e.target.value)}
                                    disabled={isLoading}
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full sm:w-auto" disabled={isLoading || isProfileLoading}>
                                {isLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="mr-2 h-4 w-4" />
                                )}
                                إرسال طلب السحب
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card className="sticky top-24">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Wallet className="h-5 w-5 text-muted-foreground" />
                                <span>رصيد الأرباح</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isProfileLoading ? (
                                <Skeleton className="h-10 w-32" />
                            ) : (
                                <p className="text-4xl font-bold font-mono text-primary">${referralEarnings.toFixed(2)}</p>
                            )}
                            <p className="text-sm text-muted-foreground mt-2">
                                هذا هو رصيدك القابل للسحب من عمولات الشبكة.
                            </p>
                        </CardContent>
                    </Card>
                     <Alert variant="default" className="border-amber-500/50">
                        <AlertTriangle className="h-4 w-4 !text-amber-500" />
                        <AlertTitle className="text-amber-700 dark:text-amber-400">ملاحظات هامة</AlertTitle>
                        <AlertDescription>
                           <ul className="list-disc pr-4 text-xs space-y-1 mt-2">
                                <li>يتم مراجعة طلبات السحب يدويًا.</li>
                                <li>تستغرق عملية التحويل مدة تصل إلى 24 ساعة عمل.</li>
                                <li>تأكد من صحة بيانات الدفع لتجنب أي تأخير.</li>
                           </ul>
                        </AlertDescription>
                    </Alert>
                </div>
            </div>
        </div>
    );
}
