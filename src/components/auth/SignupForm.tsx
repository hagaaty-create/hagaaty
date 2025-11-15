'use client';

import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useAuth, useFirestore } from "@/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, serverTimestamp, collection, query, where, getDocs, FieldValue, limit, increment } from "firebase/firestore";
import { sendWelcomeEmail } from "@/ai/flows/send-welcome-email";
import { setDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";


function SignupFormComponent() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  
  useEffect(() => {
    const refFromUrl = searchParams.get('ref');
    if (refFromUrl) {
      setReferralCode(refFromUrl);
    }
  }, [searchParams]);
  
  const generateReferralCode = (length: number) => {
    const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !firestore) {
        toast({
            variant: 'destructive',
            title: 'خطأ في المصادقة',
            description: 'لم يتم تهيئة خدمة المصادقة. يرجى المحاولة مرة أخرى.',
        });
        return;
    }
    if (password.length < 6) {
      toast({
        variant: 'destructive',
        title: 'كلمة مرور ضعيفة',
        description: 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Step 1: Find the referrer by their code to get their ancestor list
      let referrerAncestors: string[] = [];
      let referrerUid: string | null = null;
      let referrerDocRef = null;
      if (referralCode) {
        const usersRef = collection(firestore, 'users');
        const q = query(usersRef, where('referralCode', '==', referralCode), limit(1));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const referrerDoc = querySnapshot.docs[0];
          referrerUid = referrerDoc.id;
          referrerDocRef = referrerDoc.ref;
          referrerAncestors = referrerDoc.data().ancestors || [];

          // Award achievement to referrer and increment direct referrals count (non-blocking)
          updateDocumentNonBlocking(referrerDocRef, {
            achievements: FieldValue.arrayUnion({
              id: 'team_builder',
              name: 'بنّاء الفريق',
              awardedAt: serverTimestamp()
            }),
            directReferralsCount: increment(1)
          });

        } else {
            // Handle invalid referral code, maybe show a warning, but proceed with signup
            toast({
                variant: "destructive",
                title: "رمز الإحالة غير صالح",
                description: "لم يتم العثور على المستخدم صاحب الرمز. سيتم إنشاء حسابك بدون إحالة."
            });
        }
      }

      // Step 2: Create the user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      await updateProfile(userCredential.user, { displayName: fullName });
      
      const userRole = email === 'hagaaty@gmail.com' ? 'admin' : 'user';

      // Step 3: Construct the new user's ancestor list
      const newAncestors = referrerUid ? [referrerUid, ...referrerAncestors].slice(0, 5) : [];
      
      // Step 4: Create the user document in Firestore
      const userDocRef = doc(firestore, 'users', userCredential.user.uid);
      
      const userProfileData = {
        id: userCredential.user.uid,
        displayName: fullName,
        email: email,
        role: userRole,
        balance: 2.00, // Welcome bonus
        points: 0,
        lastMarketingTriggerAt: null,
        createdAt: serverTimestamp(),
        referralCode: generateReferralCode(6),
        referralEarnings: 0,
        directReferralsCount: 0,
        referredBy: referralCode || null, // Store the referral code
        status: 'active',
        ancestors: newAncestors, // Store the calculated MLM upline
        achievements: [], // Initialize achievements array
        isAgencyMember: false,
      };
      
      // Use non-blocking write for faster UX
      setDocumentNonBlocking(userDocRef, userProfileData, {});

      // Fire and forget welcome email
      sendWelcomeEmail({ userName: fullName, userEmail: email }).catch(err => {
        console.error("Failed to send welcome email:", err);
      });

      toast({
        title: "تم إنشاء الحساب بنجاح!",
        description: `أهلاً بك! لقد حصلت على دور ${userRole} ورصيد إضافي بقيمة 2 دولار.`,
      });
      
      router.push('/dashboard');

    } catch (error: any) {
        let title = 'فشل إنشاء الحساب';
        let description = 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';

        if (error.code === 'auth/email-already-in-use') {
            description = 'هذا البريد الإلكتروني مسجل بالفعل. حاول تسجيل الدخول بدلاً من ذلك.';
        } else if (error.code === 'auth/invalid-email') {
            description = 'البريد الإلكتروني الذي أدخلته غير صالح.';
        } else if (error.code === 'auth/weak-password') {
            description = 'كلمة المرور ضعيفة جدًا. يجب أن تتكون من 6 أحرف على الأقل.';
        } else if (error.code === 'auth/api-key-not-valid') {
            description = 'مفتاح API غير صالح. يرجى التأكد من صحة إعدادات Firebase.';
        } else if (error.code === 'permission-denied') {
            description = 'تم رفض الإذن. تحقق من قواعد أمان Firestore الخاصة بك.';
        }
        console.error("Signup error: ", error.code, error.message);
        toast({
            variant: 'destructive',
            title: title,
            description: description,
        });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Card className="mx-auto max-w-sm w-full bg-card/50 border-border/50">
      <CardHeader>
        <CardTitle className="text-xl font-headline">إنشاء حساب جديد</CardTitle>
        <CardDescription>
          أدخل معلوماتك واحصل فورًا على رصيد ترحيبي بقيمة 2$ لتجربة إعلانك الأول!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignup} className="grid gap-4">
          <div className="grid gap-2 text-right">
              <Label htmlFor="full-name">الاسم الكامل</Label>
              <Input 
                id="full-name" 
                placeholder="مثال: محمد أحمد" 
                required 
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                disabled={isLoading}
              />
          </div>
          <div className="grid gap-2 text-right">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="grid gap-2 text-right">
            <Label htmlFor="password">كلمة المرور</Label>
            <Input 
              id="password" 
              type="password" 
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
           <div className="grid gap-2 text-right">
              <Label htmlFor="referral-code">رمز الإحالة (اختياري)</Label>
              <Input 
                id="referral-code" 
                placeholder="أدخل رمز الإحالة هنا" 
                value={referralCode}
                onChange={e => setReferralCode(e.target.value)}
                disabled={isLoading || !!searchParams.get('ref')}
              />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            إنشاء حساب
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          لديك حساب بالفعل؟{" "}
          <Link href="/login" className="underline">
            تسجيل الدخول
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}


export default function SignupForm() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignupFormComponent />
    </Suspense>
  )
}
