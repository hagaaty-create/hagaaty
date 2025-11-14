import Image from 'next/image';
import Link from 'next/link';
import type { Post } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

type ArticleCardProps = {
  post: Post;
  isFeatured?: boolean;
};

export function ArticleCard({ post, isFeatured = false }: ArticleCardProps) {
  return (
    <Link href={`/articles/${post.slug}`} className="group block">
      <Card className={cn(
          "h-full flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
          isFeatured ? "lg:flex-row" : "overflow-hidden"
          )}>
        <div className={cn("relative", isFeatured ? "lg:w-1/2" : "aspect-[16/9]")}>
          <Image
            src={post.imageUrl}
            alt={post.title}
            fill
            className="object-cover"
            data-ai-hint={post.imageHint}
          />
        </div>
        <div className={cn("flex flex-col flex-1", isFeatured ? "lg:w-1/2" : "")}>
          <CardHeader>
            <Badge variant="secondary" className="w-fit mb-2">{post.category}</Badge>
            <CardTitle className={cn("group-hover:text-primary transition-colors", isFeatured ? "text-3xl" : "text-xl")}>{post.title}</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <p className="text-muted-foreground">{post.excerpt}</p>
          </CardContent>
          <CardFooter className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={post.author.avatarUrl} alt={post.author.name} />
                <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{post.author.name}</p>
                <p className="text-xs text-muted-foreground">{format(new Date(post.date), 'PPP')}</p>
              </div>
            </div>
            {isFeatured && (
                <div className="flex items-center gap-2 text-primary font-semibold">
                    Read More <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
            )}
          </CardFooter>
        </div>
      </Card>
    </Link>
  );
}
