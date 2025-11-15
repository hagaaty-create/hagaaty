'use client';

import { ArticleCard } from '@/components/blog/ArticleCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import type { Post } from '@/types';
import { useMemo } from 'react';

type BlogPageClientProps = {
  posts: Post[];
};

export default function BlogPageClient({ posts }: BlogPageClientProps) {

  const categories = useMemo(() => {
    if (!posts) return [];
    const uniqueCategories = ['الكل', ...Array.from(new Set(posts.map(p => p.category)))];
    return uniqueCategories;
  }, [posts]);
  
  const featuredPost = useMemo(() => posts?.[0], [posts]);
  const otherPosts = useMemo(() => posts?.slice(1), [posts]);
  
  if (!posts || posts.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 text-center min-h-[60vh] flex flex-col justify-center items-center">
        <h1 className="text-4xl font-bold font-headline">لا توجد مقالات بعد</h1>
        <p className="text-muted-foreground mt-4 text-lg">
          وكلاء الذكاء الاصطناعي لدينا يعملون بجد. تحقق مرة أخرى لاحقًا للحصول على محتوى جديد!
        </p>
         <Button asChild className="mt-8">
          <Link href="/dashboard/admin/generate">توليد مقال الآن</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <section className="mb-16 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl font-headline">
          مدونة <span className="text-primary">حاجتي للذكاء الاصطناعي</span>
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground sm:text-xl">
          اكتشف مقالات متطورة تم إنشاؤها بواسطة الذكاء الاصطناعي، وتفاعل مع مساعدنا الذكي لأي أسئلة.
        </p>
      </section>

      {/* Featured Post */}
      {featuredPost && (
        <section className="mb-16">
           <h2 className="text-3xl font-bold tracking-tight mb-8 font-headline">المقال المميز</h2>
          <ArticleCard post={featuredPost} isFeatured />
        </section>
      )}

      {/* Posts */}
      <section id="posts">
        <h2 className="text-3xl font-bold tracking-tight mb-8 font-headline">كل المقالات</h2>
        <Tabs defaultValue="الكل" className="w-full" dir="rtl">
          <div className="flex justify-center mb-8">
            <TabsList className="grid grid-cols-3 p-1 h-auto md:grid-flow-col">
              {categories.map(category => (
                <TabsTrigger key={category} value={category} className="text-base px-4 py-2">
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          {categories.map(category => (
            <TabsContent key={category} value={category}>
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {(category === 'الكل' ? otherPosts : otherPosts?.filter(p => p.category === category))?.map(post => (
                  <ArticleCard key={post.id} post={post} />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </section>
    </div>
  );
}
