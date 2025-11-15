'use server';

import { notFound } from 'next/navigation';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase/server-initialization';
import type { Post } from '@/types';
import { Metadata } from 'next';
import ArticlePageClient from './page-client';

// This is the correct props definition for a dynamic page in Next.js App Router.
type Props = {
  params: { slug: string };
};

async function getPost(slug: string): Promise<Post | null> {
  const { firestore } = initializeFirebase();
  const postsRef = collection(firestore, 'posts');
  const q = query(postsRef, where('slug', '==', slug));
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
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

export default async function ArticlePage({ params }: Props) {
  const post = await getPost(params.slug);

  if (!post) {
    notFound();
  }

  return <ArticlePageClient post={post} />;
}
