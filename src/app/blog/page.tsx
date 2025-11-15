

'use server';

import { collection, query, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase/server-initialization';
import type { Post } from '@/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArticleCard } from '@/components/blog/ArticleCard';


async function getPosts(): Promise<Post[]> {
  const { firestore } = initializeFirebase();
  const postsQuery = query(collection(firestore, 'posts'), orderBy('date', 'desc'));
  const querySnapshot = await getDocs(postsQuery);
  const posts = querySnapshot.docs.map(doc => {
    const data = doc.data();
    // Ensure date is a serializable string
    const date = data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date;
    return { id: doc.id, ...data, date } as Post;
  });
  return posts;
}

export default async function BlogPage() {
  const posts = await getPosts();
  const featuredPost = posts[0];
  const otherPosts = posts.slice(1);

  return (
    <div className="container mx-auto px-4 py-12">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-6xl font-headline">
          مدونة حاجتي للذكاء الاصطناعي
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          استكشف أحدث المقالات والأفكار في عالم التسويق الرقمي والإعلانات، كلها مكتوبة بقوة الذكاء الاصطناعي.
        </p>
      </header>

      {featuredPost && (
        <section className="mb-12">
          <ArticleCard post={featuredPost} isFeatured={true} />
        </section>
      )}

      {otherPosts.length > 0 && (
        <section>
          <h2 className="text-3xl font-bold tracking-tight mb-8 font-headline">
            المزيد من المقالات
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {otherPosts.map(post => (
              <ArticleCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}

       {!posts || posts.length === 0 && (
         <div className="text-center py-20">
            <h2 className="text-2xl font-semibold mb-4">لا توجد مقالات بعد</h2>
            <p className="text-muted-foreground mb-6">يبدو أن المدونة فارغة حاليًا. يمكنك إنشاء أول مقال لك من لوحة التحكم.</p>
            <Button asChild>
                <Link href="/dashboard/admin/generate">اذهب لتوليد مقال</Link>
            </Button>
        </div>
       )}
    </div>
  );
}
