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
import { useAuth, useFirestore } from "@/firebase";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { createUserWithEmailAndPassword, updateProfile, User } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { Loader2 } from "lucide-react";

export default function SignupForm() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const createUserProfile = async (user: User, customDisplayName?: string) => {
    if (!firestore) return;
    const userRef = doc(firestore, 'users', user.uid);
    
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
      const displayName = customDisplayName || user.displayName;
      const isFirstAdmin = user.email === 'hagaaty@gmail.com';
      await setDoc(userRef, {
        displayName: displayName,
        email: user.email,
        photoURL: user.photoURL,
        balance: 2.00,
        role: isFirstAdmin ? 'admin' : 'user'
      });
       toast({
          title: "تم إنشاء الحساب!",
          description: "أهلاً بك! لقد حصلت على رصيد إضافي بقيمة 2 دولار.",
      });
    } else {
       await setDoc(userRef, {
        displayName: customDisplayName || user.displayName,
        email: user.email,
        photoURL: user.photoURL,
      }, { merge: true });
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
        toast({
            variant: 'destructive',
            title: 'خطأ في التهيئة',
            description: 'لم يتم تهيئة خدمة المصادقة. يرجى المحاولة مرة أخرى.',
        });
        return;
    }
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      await updateProfile(userCredential.user, { displayName: fullName });
      
      await createUserProfile(userCredential.user, fullName);
      
      await userCredential.user.reload();

      router.push('/dashboard');
    } catch (error: any) {
      console.error("Signup error:", error);
      toast({
        variant: 'destructive',
        title: 'فشل إنشاء الحساب',
        description: 'حدث خطأ ما، يرجى المحاولة مرة أخرى.',
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
