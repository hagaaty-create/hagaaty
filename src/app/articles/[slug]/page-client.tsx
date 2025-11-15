'use client';

import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import type { Post } from '@/types';
import { Timestamp } from 'firebase/firestore';


type ArticlePageClientProps = {
  post: Post;
};

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


export default function ArticlePageClient({ post }: ArticlePageClientProps) {

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

      <div 
        className="prose prose-lg dark:prose-invert max-w-none text-foreground/90 prose-p:leading-relaxed prose-headings:text-foreground prose-a:text-primary hover:prose-a:text-primary/80 prose-strong:text-foreground"
        dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br />') }}
       />

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
