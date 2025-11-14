import { posts } from '@/lib/data';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

type ArticlePageProps = {
  params: {
    slug: string;
  };
};

export function generateStaticParams() {
  return posts.map(post => ({
    slug: post.slug,
  }));
}

export default function ArticlePage({ params }: ArticlePageProps) {
  const post = posts.find(p => p.slug === params.slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="container max-w-4xl mx-auto px-4 py-12">
        <div className='mb-8'>
            <Button variant="ghost" asChild>
                <Link href="/blog">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Blog
                </Link>
            </Button>
        </div>
      <header className="mb-8">
        <div className="mb-4">
            <Badge variant="secondary">{post.category}</Badge>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl font-headline text-primary">
          {post.title}
        </h1>
        <div className="mt-6 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.author.avatarUrl} alt={post.author.name} />
              <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{post.author.name}</p>
              <p className="text-sm text-muted-foreground">
                Published on {format(new Date(post.date), 'PPP')}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="relative w-full aspect-[16/9] mb-8 rounded-lg overflow-hidden shadow-lg">
        <Image src={post.imageUrl} alt={post.title} fill className="object-cover" data-ai-hint={post.imageHint}/>
      </div>

      <div className="prose prose-lg max-w-none text-foreground prose-headings:text-primary prose-a:text-accent prose-strong:text-foreground">
        {post.content.split('\n\n').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
        ))}
      </div>

      <footer className="mt-12">
        <div className="flex flex-wrap gap-2">
            <span className="font-semibold">Tags:</span>
            {post.tags.map(tag => (
                <Badge key={tag} variant="outline">{tag}</Badge>
            ))}
        </div>
      </footer>
    </article>
  );
}
