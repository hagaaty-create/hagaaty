'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Check, Crown, ExternalLink, ImagePlus, Loader2, Mail, ShieldCheck, TrendingUp, Zap, Rocket, CheckCircle, PartyPopper } from "lucide-react";
import { useState, useEffect } from "react";
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { Badge } from "@/components/ui/badge";
import { verifyAgencySubscription } from "@/ai/flows/verify-agency-subscription";
import { doc } from "firebase/firestore";
import Link from "next/link";

type UserProfile = {
    isAgencyMember?: boolean;
}

const agencyFeatures = [
    {
        icon: <ShieldCheck className="h-6 w-6 text-green-500" />,
        text: "حسابات إعلانية موثقة ومحمية ضد الإغلاق العشوائي.",
    },
    {
        icon: <Zap className="h-6 w-6 text-yellow-500" />,
        text: "إمكانية فتح حسابات لوكالات جوجل، تيك توك، سناب شات، وفيسبوك.",
    },
    {
        icon: <TrendingUp className="h-6 w-6 text-blue-500" />,
        text: "انفاق بلا حدود واستهداف جميع دول العالم.",
    },
    {
        icon: <Crown className="h-6 w-6 text-purple-500" />,
        text: "شريك رسمي (Partner) للمنصات الإعلانية الكبرى.",
    },
];

const paymentMethods = [
    { name: "فودافون كاش", detail: "01000000000" },
    { name: "محفظة بنكية", detail: "01000000001" },
    { name: "USDT (TRC20)", detail: "YOUR_USDT_WALLET_ADDRESS" },
];

const AGENCY_FEE = 40.00;

function SubscriptionForm() {
    const [email, setEmail] = useState('');
    const [paymentProof, setPaymentProof] = useState<File | null>(null);
    const [imageBase64, setImageBase64] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const { toast } = useToast();
    const { user } = useUser();

    useEffect(() => {
        if (user?.email) {
            setEmail(user.email);
        }
    }, [user]);

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
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !email || !paymentProof || !imageBase64) {
            toast({ variant: 'destructive', title: 'بيانات ناقصة', description: 'يرجى إدخال بريدك الإلكتروني ورفع صورة إثبات الدفع.' });
            return;
        }
        setIsLoading(true);

        verifyAgencySubscription({
            userId: user.uid,
            userEmail: email,
            paymentProofDataUri: imageBase64,
        }).catch(err => {
            console.error("Error in background agency subscription flow:", err);
        });

        setIsSubmitted(true);
        setIsLoading(false);
        toast({
            title: '✅ تم إرسال طلبك بنجاح',
            description: 'يقوم الذكاء الاصطناعي بمراجعة الإيصال الآن. سيتم تفعيل اشتراكك وتوزيع عمولات الشبكة خلال دقيقة.',
        });
    };

    if (isSubmitted) {
        return (
            <Card className="max-w-2xl mx-auto text-center py-16 px-6 border-green-500 bg-green-500/5">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6"/>
                <CardTitle className="text-2xl font-headline">تم استلام طلبك بنجاح!</CardTitle>
                <CardDescription className="mt-4 text-base">
                    يقوم وكيل الذكاء الاصطناعي حاليًا بتحليل إيصال الدفع الخاص بك. سيتم تفعيل اشتراكك وتوزيع عمولات فريقك، وستتلقى بريدًا إلكترونيًا للتأكيد خلال دقائق.
                </CardDescription>
            </Card>
        );
    }

    return (
        <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-lg">1</span>
                            <span>دفع رسوم الاشتراك</span>
                        </CardTitle>
                        <CardDescription>
                            قم بتحويل مبلغ ${AGENCY_FEE.toFixed(2)} (أو ما يعادله بالعملة المحلية) إلى إحدى الوسائل التالية.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {paymentMethods.map(method => (
                            <div key={method.name} className="p-3 rounded-md border bg-muted/50">
                                <p className="font-semibold text-foreground">{method.name}</p>
                                <p className="text-muted-foreground font-mono text-sm">{method.detail}</p>
                            </div>
                        ))}
                        <p className="text-xs text-muted-foreground pt-2">بعد التحويل، يرجى أخذ لقطة شاشة أو حفظ إيصال الدفع. ستحتاجه في الخطوة التالية.</p>
                    </CardContent>
                </Card>
            </div>
            <div>
                 <Card className="sticky top-24">
                    <CardHeader>
                       <CardTitle className="flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-lg">2</span>
                            <span>تأكيد الاشتراك</span>
                        </CardTitle>
                        <CardDescription>
                            املأ النموذج أدناه وأرفق إثبات الدفع. سيقوم الذكاء الاصطناعي بالتحقق وتفعيل اشتراكك وتوزيع عمولات الشبكة تلقائيًا.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="email">بريدك الإلكتروني</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="your@email.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                    disabled={isLoading || !!user?.email}
                                />
                            </div>
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
                                            <span className="truncate">{paymentProof ? paymentProof.name : "اختر صورة..."}</span>
                                            <ImagePlus className="h-5 w-5" />
                                        </div>
                                    </label>
                                </div>
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading || !email || !paymentProof}>
                                {isLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Mail className="mr-2 h-4 w-4" />
                                )}
                                إرسال وتفعيل آلي
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function AgencyMemberView() {
    return (
        <Card className="max-w-3xl mx-auto text-center py-16 px-6 border-primary/50 bg-primary/5">
            <PartyPopper className="h-16 w-16 text-primary mx-auto mb-6"/>
            <CardTitle className="text-2xl font-headline text-primary">أهلاً بك في وكالة حاجتي!</CardTitle>
            <CardDescription className="mt-4 text-base max-w-xl mx-auto">
                تهانينا! أنت الآن عضو مميز في وكالة حاجتي الإعلانية. لديك الآن وصول إلى حسابات إعلانية موثقة ومحمية. انطلق بحملاتك بلا حدود.
            </CardDescription>
            <CardContent className="mt-8">
                <Button asChild size="lg">
                    <Link href="/dashboard/create-ad">
                        <Rocket className="ml-2 h-5 w-5"/>
                        إنشاء حساب إعلاني جديد
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );
}


export default function ServicesPage() {
    const { user } = useUser();
    const firestore = useFirestore();

    const userProfileRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'users', user.uid);
    }, [user, firestore]);

    const { data: userProfile, isLoading } = useDoc<UserProfile>(userProfileRef);

    return (
        <div className="container mx-auto px-4 py-12">
            <section className="mb-20 text-center">
                <Badge variant="outline" className="mb-4 text-sm font-semibold border-primary/50 text-primary bg-primary/10">
                    حصريًا للمسوقين الطموحين
                </Badge>
                <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl font-headline">
                    انضم إلى <span className="text-primary">وكالة حاجتي</span> الإعلانية
                </h1>
                <p className="mt-6 max-w-3xl mx-auto text-lg text-muted-foreground sm:text-xl">
                    بـ ${AGENCY_FEE.toFixed(2)} سنويًا فقط، احصل على حسابات وكالة إعلانية موثقة ومحمية على أكبر المنصات، وانطلق بحملاتك بلا حدود وبأمان تام.
                </p>
            </section>

            <section className="mb-20">
                <h2 className="text-3xl font-bold text-center tracking-tight mb-12 font-headline">
                    لماذا تختار وكالة حاجتي؟
                </h2>
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                    {agencyFeatures.map((feature, index) => (
                        <Card key={index} className="text-center p-6 bg-card/50">
                            <div className="flex justify-center items-center h-12 w-12 rounded-full bg-primary/10 mx-auto mb-4">
                                {feature.icon}
                            </div>
                            <p className="text-foreground font-medium">{feature.text}</p>
                        </Card>
                    ))}
                </div>
            </section>

            <section>
                 <h2 className="text-3xl font-bold text-center tracking-tight mb-12 font-headline">
                    خطوات الاشتراك
                </h2>
                 {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    </div>
                 ) : userProfile?.isAgencyMember ? (
                     <AgencyMemberView />
                 ) : (
                    <SubscriptionForm />
                 )}
            </section>
            
            <section className="mt-20">
                 <h2 className="text-3xl font-bold text-center tracking-tight mb-12 font-headline">
                    ماذا بعد الاشتراك؟
                </h2>
                <Card className="max-w-4xl mx-auto bg-card/50 border-primary/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3"><Rocket className="h-6 w-6 text-primary"/> استلام بيانات الدخول وبدء العمل</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-muted-foreground leading-relaxed">
                          بعد إرسال طلبك ومراجعته من قبل فريقنا، ستستلم رسالة على بريدك الإلكتروني خلال 3 ساعات عمل تحتوي على بيانات تسجيل الدخول الخاصة بك إلى الوكالة (رابط الوكالة، اسم المستخدم، وكلمة المرور).
                        </p>
                        <p className="font-semibold text-foreground">بمجرد تسجيل دخولك، يمكنك فورًا:</p>
                        <ul className="space-y-2">
                            <li className="flex items-start gap-3">
                                <Check className="h-5 w-5 text-green-500 mt-1 shrink-0" />
                                <span className="text-muted-foreground">فتح أي عدد من الحسابات الإعلانية الموثقة (ايجنسي) على المنصة التي تختارها.</span>
                            </li>
                             <li className="flex items-start gap-3">
                                <Check className="h-5 w-5 text-green-500 mt-1 shrink-0" />
                                <span className="text-muted-foreground">الاستمتاع بحسابات محمية ضد التعليق والإغلاق العشوائي.</span>
                            </li>
                             <li className="flex items-start gap-3">
                                <Check className="h-5 w-5 text-green-500 mt-1 shrink-0" />
                                <span className="text-muted-foreground">استهداف جميع دول العالم وإطلاق حملاتك بدون حدود على الإنفاق.</span>
                            </li>
                        </ul>
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}
