import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gift, Zap, Percent, Users, Bot, BarChart } from 'lucide-react';
import Link from 'next/link';
import { collection, query, orderBy, getDocs, limit } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase/server-initialization';
import type { Post } from '@/types';
import { ArticleCard } from '@/components/blog/ArticleCard';

async function getRecentPosts() {
  const { firestore } = initializeFirebase();
  const postsQuery = query(collection(firestore, 'posts'), orderBy('date', 'desc'), limit(3));
  const querySnapshot = await getDocs(postsQuery);
  const posts = querySnapshot.docs.map(doc => {
    const data = doc.data();
    // Ensure date is a serializable string
    const date = data.date.toDate().toISOString();
    return { id: doc.id, ...data, date } as Post;
  });
  return posts;
}


export default async function Home() {
  const recentPosts = await getRecentPosts();

  const features = [
    {
      icon: <Zap className="h-8 w-8 text-primary" />,
      title: 'إطلاق إعلانات جوجل الفورية',
      description: 'احصل على رصيد ترحيبي بقيمة 2$ لتجربة إعلانك الأول. يقوم الذكاء الاصطناعي بتصميم وتفعيل حملتك خلال 10 دقائق فقط!',
    },
    {
      icon: <Percent className="h-8 w-8 text-primary" />,
      title: 'خصم 20% على الشحن',
      description: 'استمتع بخصم ثابت 20% على كل مرة تقوم فيها بشحن رصيدك الإعلاني، مما يمنحك قيمة أكبر وميزانية تسويقية أضخم.',
    },
     {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: 'اكسب من فريقك بالكامل (MLM)',
      description: 'اكسب عمولات من شبكة تمتد لـ 5 مستويات. عندما يقوم أي شخص في فريقك بشحن رصيده، تحصل على أرباح يمكنك سحبها.',
    },
     {
      icon: <Bot className="h-8 w-8 text-primary" />,
      title: 'مساعد ذكي ومحتوى للمدونة',
      description: 'استخدم مساعدنا الذكي للإجابة على استفساراتك، وقم بتوليد مقالات احترافية لمدونتك بضغطة زر.',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="mb-20 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-primary sm:text-5xl md:text-6xl font-headline">
           أطلق حملاتك الإعلانية والتسويقية خلال دقائق
        </h1>
        <p className="mt-6 max-w-3xl mx-auto text-lg text-muted-foreground sm:text-xl">
          منصة حاجتي تستخدم ذكاء اصطناعي شبه مستقل لإنشاء حملات إعلانية ناجحة، كتابة محتوى اجتماعي، وتحليل أدائك. ابدأ اليوم برصيد 2$ مجاني!
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/signup">ابدأ الآن واحصل على 2$</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/dashboard">اذهب إلى لوحة التحكم</Link>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="mb-20">
        <h2 className="text-3xl font-bold text-center tracking-tight mb-12 font-headline">
          مستقبلك في التسويق الرقمي يبدأ هنا
        </h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-2">
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

      {/* Recent Posts Section */}
      {recentPosts.length > 0 && (
        <section>
          <h2 className="text-3xl font-bold text-center tracking-tight mb-4 font-headline">
            أحدث المقالات من مدونتنا
          </h2>
           <p className="text-lg text-muted-foreground text-center mb-12">
            محتوى تم إنشاؤه بواسطة الذكاء الاصطناعي لمساعدتك على النجاح.
          </p>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {recentPosts.map(post => (
              <ArticleCard key={post.id} post={post} />
            ))}
          </div>
           <div className="mt-12 text-center">
            <Button asChild variant="outline" size="lg">
              <Link href="/blog">عرض كل المقالات</Link>
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
