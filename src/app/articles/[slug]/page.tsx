'use client';

import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { doc, collection, query, where, getDocs, getDoc, DocumentData } from 'firebase/firestore';
import type { Post } from '@/types';
import { useEffect, useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { initializeFirebase } from '@/firebase';
import { Metadata, ResolvingMetadata } from 'next';

type ArticlePageProps = {
  params: {
    slug: string;
  };
};

// This function now runs on the server to generate metadata
export async function generateMetadata(
  { params }: ArticlePageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { firestore } = initializeFirebase();
  const { slug } = params;

  const postsRef = collection(firestore, 'posts');
  const q = query(postsRef, where('slug', '==', slug));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return {
      title: 'Article Not Found',
    }
  }

  const postDoc = querySnapshot.docs[0];
  const post = postDoc.data() as Post;

  return {
    title: post.title,
    description: post.excerpt,
  };
}


function formatDate(date: string | Timestamp) {
    if (typeof date === 'string') {
        return format(new Date(date), 'PPP');
    }
    if (date instanceof Timestamp) {
        return format(date.toDate(), 'PPP');
    }
    return "Date not available";
}


export default function ArticlePage({ params }: ArticlePageProps) {
  const firestore = useFirestore();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firestore || !params.slug) return;

    const fetchPost = async () => {
      setLoading(true);
      const postsRef = collection(firestore, 'posts');
      const q = query(postsRef, where('slug', '==', params.slug));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const postDoc = querySnapshot.docs[0];
        setPost({ id: postDoc.id, ...postDoc.data() } as Post);
      } else {
        setPost(null);
      }
      setLoading(false);
    };

    fetchPost();
  }, [firestore, params.slug]);

  if (loading) {
    return (
        <article className="container max-w-4xl mx-auto px-4 py-12">
            <div className='mb-8'>
                <Skeleton className="h-10 w-48" />
            </div>
             <header className="mb-8 space-y-4">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-10 w-3/4" />
                <div className="mt-6 flex items-center gap-4 pt-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className='space-y-2'>
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                </div>
            </header>
            <Skeleton className="w-full aspect-video mb-8 rounded-lg" />
            <div className="prose prose-lg dark:prose-invert max-w-none space-y-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-5/6" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-4/6" />
            </div>
        </article>
    );
  }

  if (!post) {
    notFound();
  }

  return (
    <article className="container max-w-4xl mx-auto px-4 py-12">
        <div className='mb-8'>
            <Button variant="ghost" asChild>
                <Link href="/blog">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    العودة للمدونة
                </Link>
            </Button>
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

      <div className="prose prose-lg dark:prose-invert max-w-none text-foreground/90 prose-headings:text-foreground prose-a:text-primary hover:prose-a:text-primary/80 prose-strong:text-foreground">
        {post.content.split('\n\n').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
        ))}
      </div>

      <footer className="mt-12">
        <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-foreground">الوسوم:</span>
            {post.tags.map(tag => (
                <Badge key={tag} variant="outline">{tag}</Badge>
            ))}
        </div>
      </footer>
    </article>
  );
}
