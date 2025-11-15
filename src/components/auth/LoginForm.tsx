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
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';


export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
        toast({
            variant: 'destructive',
            title: 'خطأ في المصادقة',
            description: 'لم يتم تهيئة خدمة المصادقة. يرجى المحاولة مرة أخرى.',
        });
        return;
    }

    setIsLoading(true);
    try {
        await signInWithEmailAndPassword(auth, email, password);
        toast({
            title: "تم تسجيل الدخول بنجاح",
            description: "أهلاً بعودتك!",
        });
        router.push('/dashboard');
    } catch (error: any) {
        let title = 'فشل تسجيل الدخول';
        let description = 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            description = 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
        } else if (error.code === 'auth/invalid-email') {
            description = 'البريد الإلكتروني الذي أدخلته غير صالح.';
        }
        toast({
            variant: 'destructive',
            title: title,
            description: description,
        });
    } finally {
        setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
     if (!auth) {
        toast({
            variant: 'destructive',
            title: 'خطأ',
            description: 'خدمة المصادقة غير متاحة حاليًا.',
        });
        return;
    }
    if (!email) {
        toast({
            variant: 'destructive',
            title: 'مطلوب بريد إلكتروني',
            description: 'الرجاء إدخال بريدك الإلكتروني في الحقل المخصص أولاً.',
        });
        return;
    }
    try {
        await sendPasswordResetEmail(auth, email);
        toast({
            title: "تم إرسال بريد إلكتروني لإعادة التعيين",
            description: "تحقق من بريدك الوارد للحصول على إرشادات إعادة تعيين كلمة المرور.",
        });
    } catch (error: any) {
         toast({
            variant: "destructive",
            title: "فشل إرسال البريد الإلكتروني",
            description: "لم نتمكن من إرسال بريد إعادة التعيين. تأكد من أن البريد الإلكتروني صحيح.",
        });
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
              disabled={isLoading}
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
                           أدخل بريدك الإلكتروني المسجل في حقل تسجيل الدخول أولاً، ثم انقر على "إرسال". سنرسل لك رابطًا لإعادة تعيين كلمة المرور الخاصة بك.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={handlePasswordReset}>
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
              disabled={isLoading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            تسجيل الدخول
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
