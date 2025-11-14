'use client';

import { ArticleCard } from '@/components/blog/ArticleCard';
import { Button } from '@/components/ui/button';
import { useCollection } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import type { Post } from '@/types';
import { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function BlogPage() {
  const firestore = useFirestore();
  const postsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'posts'), orderBy('date', 'desc'));
  }, [firestore]);

  const { data: posts, loading } = useCollection<Post>(postsQuery);

  const categories = useMemo(() => {
    if (!posts) return [];
    const uniqueCategories = ['الكل', ...Array.from(new Set(posts.map(p => p.category)))];
    return uniqueCategories;
  }, [posts]);
  
  const featuredPost = useMemo(() => posts?.[0], [posts]);
  
  if (loading) {
      return (
          <div className="container mx-auto px-4 py-8">
              <section className="mb-16 text-center">
                  <Skeleton className="h-12 w-1/2 mx-auto" />
                  <Skeleton className="h-6 w-3/4 mx-auto mt-4" />
              </section>
              <section className="mb-16">
                  <Skeleton className="h-8 w-1/4 mb-8" />
                  <div className="grid gap-8 md:grid-cols-2">
                    <Skeleton className="h-96 w-full" />
                    <Skeleton className="h-96 w-full" />
                  </div>
              </section>
              <section>
                   <Skeleton className="h-8 w-1/4 mb-8" />
                   <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                       <Skeleton className="w-full h-80" />
                       <Skeleton className="w-full h-80" />
                       <Skeleton className="w-full h-80" />
                   </div>
              </section>
          </div>
      )
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-3xl font-bold">لا توجد مقالات بعد</h1>
        <p className="text-muted-foreground mt-2">تحقق مرة أخرى لاحقًا للحصول على محتوى جديد!</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="mb-16 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl md:text-6xl font-headline">
          مدونة حاجتي للذكاء الاصطناعي
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
        <Tabs defaultValue="الكل" className="w-full">
          <TabsList className="grid w-full grid-cols-3 md:w-auto md:grid-flow-col mb-4">
            {categories.map(category => (
              <TabsTrigger key={category} value={category}>{category}</TabsTrigger>
            ))}
          </TabsList>
          {categories.map(category => (
            <TabsContent key={category} value={category}>
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {(category === 'الكل' ? posts : posts.filter(p => p.category === category)).map(post => (
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
