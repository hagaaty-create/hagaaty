'use client';

import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, DocumentData } from 'firebase/firestore';
import { useParams, useSearchParams } from 'next/navigation';
import { useMemo, Suspense } from 'react';
import type { Post } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import EditArticleForm from '@/components/dashboard/EditArticleForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileEdit } from 'lucide-react';
import { notFound } from 'next/navigation';


function EditArticlePageContent() {
  const firestore = useFirestore();
  const params = useParams();
  const searchParams = useSearchParams();
  const { id } = params;

  const suggestedTitle = searchParams.get('suggestedTitle');

  const postRef = useMemoFirebase(() => {
    if (!firestore || typeof id !== 'string') return null;
    return doc(firestore, 'posts', id);
  }, [firestore, id]);

  const { data: post, isLoading: loading } = useDoc<Post>(postRef);

  const postWithSuggestion = useMemo(() => {
    if (!post) return null;
    if (suggestedTitle) {
      return { ...post, title: suggestedTitle };
    }
    return post;
  }, [post, suggestedTitle]);


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

  if (!postWithSuggestion) {
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
          <CardTitle>تحرير: {postWithSuggestion.title}</CardTitle>
          <CardDescription>
            قم بتعديل محتوى المقال أدناه. سيتم حفظ التغييرات على الفور في المدونة.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EditArticleForm post={postWithSuggestion} />
        </CardContent>
      </Card>
    </div>
  );
}


export default function EditArticlePage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <EditArticlePageContent />
        </Suspense>
    );
}
