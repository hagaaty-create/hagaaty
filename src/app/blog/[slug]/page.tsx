
'use server';

import { collection, query, where, getDocs, limit, Timestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase/server-initialization';
import type { Post } from '@/types';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { marked } from 'marked';
import ArticleComments from '@/components/blog/ArticleComments';
import ArticleAudioGenerator from '@/components/blog/ArticleAudioGenerator';


async function getPostBySlug(slug: string): Promise<Post | null> {
    const { firestore } = initializeFirebase();
    const postsRef = collection(firestore, 'posts');
    const q = query(postsRef, where('slug', '==', slug), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return null;
    }

    const doc = querySnapshot.docs[0];
    const data = doc.data();
    // Ensure date is a serializable string before returning
    const date = data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date;
    
    return { id: doc.id, ...data, date } as Post;
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
    const post = await getPostBySlug(params.slug);

    if (!post) {
        notFound();
    }
    
    const postContentHtml = marked(post.content);

    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <article>
                <header className="mb-8 text-center">
                    <div className="flex justify-center gap-2 mb-4">
                        <Badge variant="default" className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">{post.category}</Badge>
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight font-headline text-foreground">
                        {post.title}
                    </h1>
                    <div className="mt-6 flex items-center justify-center gap-4 text-muted-foreground">
                        <div className="flex items-center gap-2">
                           <Avatar className="h-10 w-10 border-2 border-primary/30">
                               <AvatarImage src={post.author.avatarUrl} alt={post.author.name} />
                               <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                           </Avatar>
                           <div>
                                <p className="font-semibold text-foreground">{post.author.name}</p>
                                <p className="text-sm">
                                    {format(new Date(post.date as string), "d MMMM yyyy", { locale: ar })}
                                </p>
                           </div>
                        </div>
                    </div>
                </header>

                <div className="relative aspect-video w-full rounded-lg overflow-hidden mb-8 shadow-lg">
                    <Image
                        src={post.imageUrl}
                        alt={post.title}
                        fill
                        className="object-cover"
                        priority
                        data-ai-hint={post.imageHint}
                    />
                </div>

                <div className="mb-8 flex justify-center">
                   <ArticleAudioGenerator post={post} />
                </div>
                
                <div
                  className="prose prose-lg dark:prose-invert max-w-none prose-p:leading-relaxed prose-headings:font-headline prose-headings:text-foreground prose-a:text-primary hover:prose-a:text-primary/80 prose-strong:text-foreground prose-blockquote:border-primary prose-blockquote:text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: postContentHtml }}
                />

                <div className="mt-8 flex flex-wrap items-center gap-2">
                    <span className="font-semibold">الوسوم:</span>
                    {post.tags.map(tag => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                </div>
            </article>

            <ArticleComments postId={post.id} />
        </div>
    );
}

export async function generateStaticParams() {
    const { firestore } = initializeFirebase();
    const postsRef = collection(firestore, 'posts');
    const snapshot = await getDocs(postsRef);
    return snapshot.docs.map(doc => ({
        slug: doc.data().slug,
    }));
}
