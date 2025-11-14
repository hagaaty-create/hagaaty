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


export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // --- MOCK AUTHENTICATION ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate a network request
    setTimeout(() => {
      // Any email/password will work for this simulation
      if (email && password) {
        console.log("Mock login successful for:", email);
        toast({
            title: "تم تسجيل الدخول (محاكاة)",
            description: "تم تسجيل دخولك بنجاح في الوضع الوهمي.",
        });
        router.push('/dashboard');
      } else {
        toast({
          variant: 'destructive',
          title: 'فشل تسجيل الدخول',
          description: 'الرجاء إدخال البريد الإلكتروني وكلمة المرور.',
        });
        setIsLoading(false);
      }
      // No need to set isLoading to false on success because we are navigating away
    }, 1000);
  };

  const handlePasswordReset = async () => {
    toast({
        title: "تم إرسال البريد الإلكتروني (محاكاة)",
        description: "في الوضع الحقيقي, سيتم إرسال بريد إلكتروني لإعادة تعيين كلمة المرور.",
    });
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
                        />
                    </div>
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
