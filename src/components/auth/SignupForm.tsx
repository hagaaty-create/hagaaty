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
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useAuth, useFirestore } from "@/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function SignupForm() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();

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
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      await updateProfile(userCredential.user, { displayName: fullName });
      
      // Create user profile document in Firestore
      const userDocRef = doc(firestore, 'users', userCredential.user.uid);
      await setDoc(userDocRef, {
        displayName: fullName,
        email: email,
        role: 'user', // default role
        balance: 2.00, // Welcome bonus
        createdAt: serverTimestamp()
      });

      toast({
        title: "تم إنشاء الحساب بنجاح!",
        description: "أهلاً بك! لقد حصلت على رصيد إضافي بقيمة 2 دولار.",
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
        <CardTitle className="text-xl font-headline">إنشاء حساب</CardTitle>
        <CardDescription>
          أدخل معلوماتك لإنشاء حساب والحصول على رصيد إضافي بقيمة 2 دولار!
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
