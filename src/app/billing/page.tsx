'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, ImagePlus, Loader2, Mail, CreditCard, DollarSign, Wallet, Banknote } from "lucide-react";
import { useState } from "react";
import { useUser } from '@/firebase';
import { verifyPaymentAndCreditUser } from "@/ai/flows/verify-payment-and-credit-user";

const paymentMethods = [
    { name: "فودافون كاش", detail: "01000000000", icon: Wallet, amount: "50.00" },
    { name: "USDT (TRC20)", detail: "TX...ADDRESS...7a", icon: DollarSign, amount: "50.00" },
];

export default function BillingPage() {
    const [paymentProof, setPaymentProof] = useState<File | null>(null);
    const [imageBase64, setImageBase64] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState(paymentMethods[0]);
    const { toast } = useToast();
    const { user } = useUser();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            if (!file.type.startsWith('image/')) {
                toast({ variant: 'destructive', title: 'ملف غير صالح', description: 'يرجى رفع ملف صورة فقط.' });
                return;
            }
            if (file.size > 5 * 1024 * 1024) { // 5MB
                toast({ variant: 'destructive', title: 'الملف كبير جدًا', description: 'يجب أن يكون حجم الصورة أقل من 5 ميجابايت.' });
                return;
            }
            setPaymentProof(file);
            
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const base64String = reader.result as string;
                setImageBase64(base64String);
            };
            reader.onerror = (error) => {
                console.error("Error converting file to base64:", error);
                toast({ variant: 'destructive', title: 'خطأ في الملف', description: 'لم نتمكن من قراءة ملف الصورة.' });
            }
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !user.email || !paymentProof || !imageBase64) {
            toast({ variant: 'destructive', title: 'بيانات ناقصة', description: 'يرجى التأكد من رفع صورة إثبات الدفع.' });
            return;
        }
        setIsLoading(true);

        // Fire-and-forget operation for a better user experience.
        // The AI flow will handle everything in the background.
        verifyPaymentAndCreditUser({
            userId: user.uid,
            userEmail: user.email,
            paymentProofDataUri: imageBase64,
            amount: parseFloat(selectedMethod.amount),
            paymentMethod: selectedMethod.name,
        }).catch(err => {
            // Log the error for debugging, but the user has already received a success message.
            console.error("Error in background payment verification flow:", err);
            // Optionally, you could implement a more robust error handling system,
            // like sending a follow-up email to the user if the background task fails.
        });

        // Show success state immediately to the user.
        setIsSubmitted(true);
        setIsLoading(false);
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <CreditCard className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold font-headline">شحن الرصيد</h1>
            </div>

            {isSubmitted ? (
                <Card className="max-w-2xl mx-auto text-center py-16 px-6 border-green-500 bg-green-500/5">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6"/>
                    <CardTitle className="text-2xl font-headline">تم إرسال طلبك للمراجعة!</CardTitle>
                    <CardDescription className="mt-4 text-base">
                        سيقوم وكيل الذكاء الاصطناعي بمراجعة إيصالك الآن. سيتم إعلامك عبر البريد الإلكتروني وإضافة الرصيد لحسابك تلقائيًا خلال دقيقة في حال نجاح التحقق.
                    </CardDescription>
                </Card>
            ) : (
                <div className="grid lg:grid-cols-2 gap-12 items-start">
                    <div className="space-y-8">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-lg">1</span>
                                    <span>اختر طريقة الدفع</span>
                                </CardTitle>
                                <CardDescription>
                                    اختر الطريقة التي تناسبك وقم بتحويل مبلغ الشحن المحدد.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {paymentMethods.map(method => (
                                    <div 
                                        key={method.name} 
                                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedMethod.name === method.name ? 'border-primary bg-primary/5' : 'bg-muted/50 hover:border-primary/50'}`}
                                        onClick={() => setSelectedMethod(method)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <method.icon className="h-6 w-6 text-primary" />
                                                <p className="font-bold text-lg text-foreground">{method.name}</p>
                                            </div>
                                            <div className="text-xl font-bold text-foreground">${method.amount}</div>
                                        </div>
                                        <p className="text-muted-foreground font-mono text-sm mt-2 text-center bg-background/50 p-2 rounded-md">{method.detail}</p>
                                    </div>
                                ))}
                                 <p className="text-xs text-muted-foreground pt-2">بعد التحويل، يرجى أخذ لقطة شاشة واضحة أو حفظ إيصال الدفع. ستحتاجه في الخطوة التالية.</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div>
                        <Card className="sticky top-24">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-lg">2</span>
                                    <span>تأكيد عملية الشحن</span>
                                </CardTitle>
                                <CardDescription>
                                    ارفع صورة إيصال الدفع. سيقوم الذكاء الاصطناعي بالتحقق منها وإضافة الرصيد لحسابك تلقائيًا.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="payment-proof">إثبات الدفع (صورة)</Label>
                                        <div className="flex items-center gap-3">
                                            <Input
                                                id="payment-proof"
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                required
                                                className="hidden"
                                                disabled={isLoading}
                                            />
                                            <label htmlFor="payment-proof" className="w-full cursor-pointer">
                                                <div className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground ring-offset-background hover:bg-accent hover:text-accent-foreground">
                                                    <span className="truncate">{paymentProof ? paymentProof.name : "اختر صورة الإيصال..."}</span>
                                                    <ImagePlus className="h-5 w-5" />
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                    <Button type="submit" className="w-full" disabled={isLoading || !paymentProof}>
                                        {isLoading ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Mail className="mr-2 h-4 w-4" />
                                        )}
                                        إرسال للتأكيد الآلي
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}
