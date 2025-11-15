'use server';

import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase/server-initialization';
import type { Post } from '@/types';
import BlogPageClient from './page-client';

async function getPosts() {
  const { firestore } = initializeFirebase();
  const postsQuery = query(collection(firestore, 'posts'), orderBy('date', 'desc'));
  const querySnapshot = await getDocs(postsQuery);
  const posts = querySnapshot.docs.map(doc => {
    const data = doc.data();
    // Ensure date is a serializable string
    const date = data.date.toDate().toISOString();
    return { id: doc.id, ...data, date } as Post;
  });
  return posts;
}

export default async function BlogPage() {
  const posts = await getPosts();

  return <BlogPageClient posts={posts} />;
}
