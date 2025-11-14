import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, BarChart, Bot, PenSquare } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const features = [
    {
      icon: <PenSquare className="h-8 w-8 text-primary" />,
      title: 'إنشاء إعلانات بالذكاء الاصطناعي',
      description: 'أنشئ نصوص إعلانية وصورًا جذابة في ثوانٍ. دع الذكاء الاصطناعي يصمم حملات تحقق أفضل النتائج.',
    },
    {
      icon: <Bot className="h-8 w-8 text-primary" />,
      title: 'تسويق ذاتي للموقع',
      description: 'يقوم وكيلنا الذكي بتحليل السوق وكتابة مقالات محسّنة لمحركات البحث لتعزيز ترتيب موقعك.',
    },
    {
      icon: <BarChart className="h-8 w-8 text-primary" />,
      title: 'تحليلات مالية',
      description: 'تتبع إنفاقك، أدر ميزانيتك، واسحب أرباح الإحالة الخاصة بك بسهولة.',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="mb-20 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-primary sm:text-5xl md:text-6xl font-headline">
          حاجتي: منصة الإعلان والتسويق بالذكاء الاصطناعي
        </h1>
        <p className="mt-6 max-w-3xl mx-auto text-lg text-muted-foreground sm:text-xl">
          أطلق وأدر وحسّن حملاتك الإعلانية باستخدام ذكاء اصطناعي شبه مستقل. من إنشاء الإعلانات إلى تحسين محركات البحث، نحن نتولى كل شيء.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/signup">ابدأ الآن مجانًا</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/dashboard">اذهب إلى لوحة التحكم</Link>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section>
        <h2 className="text-3xl font-bold text-center tracking-tight mb-12 font-headline">
          كل ما تحتاجه للنجاح
        </h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card key={index} className="flex flex-col text-center items-center transition-all duration-300 hover:shadow-primary/20 hover:shadow-lg hover:-translate-y-2">
              <CardHeader>
                <div className="bg-primary/10 p-4 rounded-full mb-4 mx-auto transition-all duration-300 group-hover:scale-110">
                  {feature.icon}
                </div>
                <CardTitle className="font-headline">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
