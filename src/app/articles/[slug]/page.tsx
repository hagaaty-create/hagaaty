
// @ts-ignore
'use server';

import { notFound } from 'next/navigation';
import { collection, query, where, getDocs, Timestamp, limit } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase/server-initialization';
import type { Post } from '@/types';
import { Metadata } from 'next';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { marked } from 'marked';
import ArticleComments from '@/components/blog/ArticleComments';
import ArticleAudioGenerator from '@/components/blog/ArticleAudioGenerator';


async function getPost(slug: string): Promise<Post | null> {
  const { firestore } = initializeFirebase();
  const postsRef = collection(firestore, 'posts');
  const q = query(postsRef, where('slug', '==', slug), limit(1));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return null;
  }

  const postDoc = querySnapshot.docs[0];
  const postData = postDoc.data();
  
  let date: string;
  if (postData.date instanceof Timestamp) {
    date = postData.date.toDate().toISOString();
  } else if (typeof postData.date === 'string') {
    date = postData.date;
  } else if (postData.date instanceof Date) {
    date = postData.date.toISOString();
  } else {
    date = new Date().toISOString(); 
  }

  return { id: postDoc.id, ...postData, date } as Post;
}

type PageProps = {
  params: Promise<{ slug: string }> | { slug: string };
};

// @ts-ignore
export async function generateMetadata({ params: paramsProp }: PageProps): Promise<Metadata> {
  const params = 'then' in paramsProp ? await paramsProp : paramsProp;
  const post = await getPost(params.slug);

  if (!post) {
    return {
      title: 'Article Not Found',
    };
  }

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [
        {
          url: post.imageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [post.imageUrl],
    },
  };
}


function formatDate(date: string | Date | Timestamp) {
    if (typeof date === 'string') {
        return format(new Date(date), 'PPP');
    }
    if (date instanceof Timestamp) {
        return format(date.toDate(), 'PPP');
    }
    if (date instanceof Date) {
        return format(date, 'PPP');
    }
    return "Date not available";
}

// @ts-ignore
export default async function ArticlePage({ params: paramsProp }: PageProps) {
  const params = 'then' in paramsProp ? await paramsProp : paramsProp;
  const post = await getPost(params.slug);

  if (!post) {
    notFound();
  }
  
  const processedContent = marked(post.content || '');

  return (
     <article className="container max-w-4xl mx-auto px-4 py-12">
        <div className='mb-8 flex justify-between items-center'>
            <Button variant="ghost" asChild>
                <Link href="/blog">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    العودة للمدونة
                </Link>
            </Button>
            <ArticleAudioGenerator post={post} />
        </div>

      <header className="mb-8">
        <div className="mb-4">
            <Badge variant="default" className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
              {post.category}
            </Badge>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl font-headline text-foreground">
          {post.title}
        </h1>
        <div className="mt-6 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Avatar className="h-10 w-10 border-2 border-primary/50">
              <AvatarImage src={post.author.avatarUrl} alt={post.author.name} />
              <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{post.author.name}</p>
              <p className="text-sm text-muted-foreground">
                نشر في {formatDate(post.date)}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="relative w-full aspect-video mb-8 rounded-lg overflow-hidden shadow-lg shadow-primary/10">
        <Image src={post.imageUrl} alt={post.title} fill className="object-cover" data-ai-hint={post.imageHint}/>
      </div>

      <div 
        className="prose prose-lg dark:prose-invert max-w-none text-foreground/90 prose-p:leading-relaxed prose-headings:text-foreground prose-a:text-primary hover:prose-a:text-primary/80 prose-strong:text-foreground"
        dangerouslySetInnerHTML={{ __html: processedContent }}
       />

      <footer className="mt-12">
        <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-foreground">الوسوم:</span>
            {Array.isArray(post.tags) && post.tags.map(tag => (
                <Badge key={tag} variant="outline">{tag}</Badge>
            ))}
        </div>
      </footer>

      <ArticleComments postId={post.id} />
    </article>
  );
}
