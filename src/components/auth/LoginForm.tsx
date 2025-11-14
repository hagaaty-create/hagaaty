'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, useFirestore } from '@/firebase';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail, setPersistence, inMemoryPersistence, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';


export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

    const checkAndCreateUserProfile = async (user: User) => {
    if (!firestore) return;
    const userRef = doc(firestore, 'users', user.uid);
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
      const isFirstAdmin = user.email === 'hagaaty@gmail.com';
      await setDoc(userRef, {
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        balance: 2.00, // Welcome bonus for signing up via Google on login page
        role: isFirstAdmin ? 'admin' : 'user'
      });
      toast({
          title: "تم إنشاء الحساب!",
          description: "أهلاً بك! لقد حصلت على رصيد إضافي بقيمة 2 دولار.",
      });
    } else {
        // If user exists, just ensure their profile info is up-to-date from Google
        await setDoc(userRef, {
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
        }, { merge: true });
    }
  }


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'فشل تسجيل الدخول',
        description: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!auth) return;
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await setPersistence(auth, inMemoryPersistence);
      const result = await signInWithPopup(auth, provider);
      await checkAndCreateUserProfile(result.user);
      router.push('/dashboard');
    } catch (error: any) {
       console.error("Google sign-in error:", error);
      toast({
        variant: 'destructive',
        title: 'فشل تسجيل الدخول بحساب جوجل',
        description: 'حدث خطأ ما، يرجى المحاولة مرة أخرى.',
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!auth || !resetEmail) return;
    setIsResetting(true);
    try {
        await sendPasswordResetEmail(auth, resetEmail);
        toast({
            title: 'تم إرسال بريد إلكتروني',
            description: 'تحقق من بريدك الإلكتروني للحصول على رابط إعادة تعيين كلمة المرور.',
        });
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'فشل إرسال البريد الإلكتروني',
            description: 'قد لا يكون هذا البريد الإلكتروني مسجلاً. يرجى التحقق والمحاولة مرة أخرى.',
        });
    } finally {
        setIsResetting(false);
    }
  }


  return (
    <Card className="mx-auto max-w-sm w-full bg-card/50 border-border/50">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">تسجيل الدخول</CardTitle>
        <CardDescription>
          أدخل بريدك الإلكتروني أدناه لتسجيل الدخول إلى حسابك
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="grid gap-4">
          <div className="grid gap-2 text-right">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading || isGoogleLoading}
            />
          </div>
          <div className="grid gap-2 text-right">
            <div className="flex items-center">
              <Label htmlFor="password">كلمة المرور</Label>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="link" className="mr-auto inline-block text-sm underline p-0 h-auto">
                        هل نسيت كلمة المرور؟
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>إعادة تعيين كلمة المرور</AlertDialogTitle>
                        <AlertDialogDescription>
                            أدخل بريدك الإلكتروني المسجل أدناه. سنرسل لك رابطًا لإعادة تعيين كلمة المرور الخاصة بك.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="grid gap-2 text-right">
                        <Label htmlFor="reset-email">البريد الإلكتروني</Label>
                        <Input
                            id="reset-email"
                            type="email"
                            placeholder="m@example.com"
                            required
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={handlePasswordReset} disabled={isResetting}>
                             {isResetting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                            إرسال
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            <Input 
              id="password" 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading || isGoogleLoading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
            {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            تسجيل الدخول
          </Button>
          <Button variant="outline" type="button" className="w-full" onClick={handleGoogleLogin} disabled={isLoading || isGoogleLoading}>
            {isGoogleLoading ? (
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            ) : (
              <svg className="ml-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-76.2 64.5C308.6 102.3 282.1 92 248 92c-73.4 0-134.3 59.4-134.3 132s60.9 132 134.3 132c77.9 0 119.3-57.8 123.4-86.9H248v-85.3h236.1c2.3 12.7 3.9 26.9 3.9 41.4z"></path></svg>
            )}
            تسجيل الدخول بحساب جوجل
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          ليس لديك حساب؟{" "}
          <Link href="/signup" className="underline">
            أنشئ حسابًا
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
