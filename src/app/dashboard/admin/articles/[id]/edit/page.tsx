'use client';

import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, DocumentData } from 'firebase/firestore';
import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import type { Post } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import EditArticleForm from '@/components/dashboard/EditArticleForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileEdit } from 'lucide-react';
import { notFound } from 'next/navigation';

export default function EditArticlePage() {
  const firestore = useFirestore();
  const params = useParams();
  const { id } = params;

  const postRef = useMemoFirebase(() => {
    if (!firestore || typeof id !== 'string') return null;
    return doc(firestore, 'posts', id);
  }, [firestore, id]);

  const { data: post, isLoading: loading } = useDoc<Post>(postRef);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <FileEdit className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold font-headline">تعديل المقال</h1>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-3/4 mt-2" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-40 w-full" />
            </div>
             <Skeleton className="h-10 w-32" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!post) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <FileEdit className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold font-headline">تعديل المقال</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>تحرير: {post.title}</CardTitle>
          <CardDescription>
            قم بتعديل محتوى المقال أدناه. سيتم حفظ التغييرات على الفور في المدونة.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EditArticleForm post={post} />
        </CardContent>
      </Card>
    </div>
  );
}
