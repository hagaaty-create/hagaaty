
'use server';

import { collection, query, where, getDocs, limit, doc, getDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase/server-initialization';
import type { Post } from '@/types';
import { notFound } from 'next/navigation';
import EditArticleForm from '@/components/dashboard/EditArticleForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileEdit } from 'lucide-react';
import { Suspense } from 'react';


async function getPostById(id: string): Promise<Post | null> {
    const { firestore } = initializeFirebase();
    const postRef = doc(firestore, 'posts', id);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) {
        return null;
    }

    const data = postSnap.data();
    // The date might not be serialized yet on the server, so we don't convert it here.
    // The form component will handle it.
    return { id: postSnap.id, ...data } as Post;
}

async function EditArticlePageContent({ searchParams }: { searchParams: { id?: string } }) {
    const postId = searchParams?.id;

    if (!postId) {
        return (
             <div className="text-center py-10">
                <p>لم يتم تحديد مقال. يرجى توفير معرّف المقال في الرابط.</p>
            </div>
        );
    }
    
    const post = await getPostById(postId);

    if (!post) {
        notFound();
    }
    
    return (
        <div className="space-y-8">
             <div className="flex items-center gap-4">
                <FileEdit className="h-8 w-8 text-primary"/>
                <h1 className="text-3xl font-bold font-headline">تعديل المقال</h1>
            </div>
            <Card>
                 <CardHeader>
                    <CardTitle>محرر المقالات</CardTitle>
                    <CardDescription>قم بإجراء تغييرات على مقالك هنا. سيتم حفظ التحديثات تلقائيًا في الخلفية.</CardDescription>
                </CardHeader>
                <CardContent>
                    <EditArticleForm post={post} />
                </CardContent>
            </Card>
        </div>
    );
}


export default function EditArticlePage({ searchParams }: { searchParams: { id?: string } }) {
    return (
        <Suspense fallback={<div className="text-center p-20">جاري تحميل المقال...</div>}>
            <EditArticlePageContent searchParams={searchParams} />
        </Suspense>
    );
}
