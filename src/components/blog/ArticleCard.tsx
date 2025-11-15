import Image from 'next/image';
import Link from 'next/link';
import type { Post } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

type ArticleCardProps = {
  post: Post;
  isFeatured?: boolean;
};

function formatDate(date: string | Date | Timestamp) {
    if (typeof date === 'string') {
        return format(new Date(date), 'PPP');
    }
    if (date instanceof Timestamp) {
        return format(date.toDate(), 'PPP');
    }
    if(date instanceof Date) {
        return format(date, 'PPP');
    }
    return "Date not available";
}

export function ArticleCard({ post, isFeatured = false }: ArticleCardProps) {
  const CardContainer = ({ children }: { children: React.ReactNode }) => (
      <div className="group block h-full">
          <Card className={cn(
              "h-full flex flex-col transition-all duration-300 hover:border-primary/50 hover:shadow-primary/20 hover:shadow-lg hover:-translate-y-2 bg-card/50 hover:bg-card",
              isFeatured ? "lg:flex-row" : "overflow-hidden"
          )}>
              {children}
          </Card>
      </div>
  );

  const content = (
      <>
          <div className={cn("relative", isFeatured ? "lg:w-1/2" : "aspect-[16/9]")}>
              <Image
                  src={post.imageUrl}
                  alt={post.title}
                  fill
                  className="object-cover"
                  data-ai-hint={post.imageHint}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
          </div>
          <div className={cn("flex flex-col flex-1", isFeatured ? "lg:w-1/2 p-4 justify-between" : "")}>
              <div>
                  <CardHeader>
                      <Badge variant="default" className="w-fit mb-2 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                          {post.category}
                      </Badge>
                      <CardTitle className={cn("group-hover:text-primary transition-colors", isFeatured ? "text-3xl font-bold" : "text-xl font-semibold")}>{post.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1">
                      <p className={cn("text-muted-foreground", isFeatured ? "line-clamp-4 text-base" : "line-clamp-3")}>{post.excerpt}</p>
                  </CardContent>
              </div>
              <CardFooter className={cn("flex justify-between items-center", isFeatured ? "pt-4" : "mt-auto")}>
                  <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8 border-2 border-primary/30">
                          <AvatarImage src={post.author.avatarUrl} alt={post.author.name} />
                          <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                          <p className="text-sm font-medium">{post.author.name}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(post.date)}</p>
                      </div>
                  </div>
                  {isFeatured && (
                      <div className="flex items-center gap-2 text-primary font-semibold">
                          اكتشف المزيد <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                      </div>
                  )}
              </CardFooter>
          </div>
      </>
  );

  // The entire card now links to the main blog page, not a specific article.
  return (
      <CardContainer>
          <Link href={`/blog`} className="contents">
            {content}
          </Link>
      </CardContainer>
  );
}
