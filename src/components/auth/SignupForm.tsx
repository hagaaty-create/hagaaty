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

export default function SignupForm() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const { toast } = useToast();

  // --- MOCK AUTHENTICATION ---
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate a network request
    setTimeout(() => {
        if (fullName && email && password) {
            console.log("Mock signup successful for:", email);
            toast({
                title: "تم إنشاء الحساب! (محاكاة)",
                description: "أهلاً بك! لقد حصلت على رصيد إضافي بقيمة 2 دولار.",
            });
            // In a real app, you would also create a user profile here.
            // For now, we just navigate to the dashboard.
            router.push('/dashboard');
        } else {
             toast({
                variant: 'destructive',
                title: 'فشل إنشاء الحساب',
                description: 'الرجاء ملء جميع الحقول.',
            });
            setIsLoading(false);
        }
    }, 1000);
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
