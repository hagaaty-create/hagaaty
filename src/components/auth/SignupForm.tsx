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
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup, User } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { Loader2 } from "lucide-react";

export default function SignupForm() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const createUserProfile = async (user: User) => {
    if (!firestore) return;
    const userRef = doc(firestore, 'users', user.uid);
    
    // Check if the user document already exists
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
      // New user, create the profile with a $2 bonus and role
      const isFirstAdmin = user.email === 'hagaaty@gmail.com';
      await setDoc(userRef, {
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        balance: 2.00, // Give $2 bonus to new users
        role: isFirstAdmin ? 'admin' : 'user'
      });
       toast({
          title: "تم إنشاء الحساب!",
          description: "أهلاً بك! لقد حصلت على رصيد إضافي بقيمة 2 دولار.",
      });
    } else {
      // Existing user, just merge the latest profile info without changing balance or role
       await setDoc(userRef, {
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
      }, { merge: true });
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: fullName });
      
      // We pass the updated user object to ensure displayName is included
      const updatedUser = { ...userCredential.user, displayName: fullName, email };
      await createUserProfile(updatedUser as User);

      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'فشل إنشاء الحساب',
        description: 'حدث خطأ ما، يرجى المحاولة مرة أخرى.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    if (!auth) return;
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      
      await createUserProfile(result.user);

      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'فشل التسجيل بحساب جوجل',
        description: 'حدث خطأ ما، يرجى المحاولة مرة أخرى.',
      });
    } finally {
      setIsGoogleLoading(false);
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
                disabled={isLoading || isGoogleLoading}
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
              disabled={isLoading || isGoogleLoading}
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
              disabled={isLoading || isGoogleLoading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
            {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            إنشاء حساب
          </Button>
          <Button variant="outline" type="button" className="w-full" onClick={handleGoogleSignup} disabled={isLoading || isGoogleLoading}>
             {isGoogleLoading ? (
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            ) : (
              <svg className="ml-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-76.2 64.5C308.6 102.3 282.1 92 248 92c-73.4 0-134.3 59.4-134.3 132s60.9 132 134.3 132c77.9 0 119.3-57.8 123.4-86.9H248v-85.3h236.1c2.3 12.7 3.9 26.9 3.9 41.4z"></path></svg>
            )}
            التسجيل باستخدام جوجل
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
