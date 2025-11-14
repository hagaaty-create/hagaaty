'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import type { Timestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Trash2, Loader2, FileEdit } from 'lucide-react';
import type { Post } from '@/types';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function ManageArticlesPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const postsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'posts'), orderBy('date', 'desc'));
  }, [firestore]);

  const { data: posts, loading } = useCollection<Post>(postsQuery);

  const formatDate = (timestamp: Timestamp | string | null) => {
    if (!timestamp) return 'N/A';
    if (typeof timestamp === 'string') {
        return format(new Date(timestamp), 'PPP');
    }
    if (timestamp instanceof Timestamp) {
        return format(timestamp.toDate(), 'PPP');
    }
    return 'Invalid Date';
  };

  const handleDelete = async (postId: string) => {
    if (!firestore) return;
    setIsDeleting(postId);
    try {
      await deleteDoc(doc(firestore, 'posts', postId));
      toast({
        title: 'تم حذف المقال',
        description: 'تمت إزالة المقال بنجاح.',
      });
    } catch (error) {
      console.error('Error deleting article:', error);
      toast({
        variant: 'destructive',
        title: 'فشل الحذف',
        description: 'لا يمكن حذف المقال. يرجى المحاولة مرة أخرى.',
      });
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <FileText className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold font-headline">إدارة المقالات</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>جميع منشورات المدونة</CardTitle>
          <CardDescription>
            عرض أو تعديل أو حذف منشورات المدونة الحالية.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          )}
          {!loading && posts && posts.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>العنوان</TableHead>
                  <TableHead>الفئة</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map(post => (
                  <TableRow key={post.id}>
                    <TableCell className="font-medium">{post.title}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{post.category}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(post.date)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/dashboard/admin/articles/${post.id}/edit`}>
                            <FileEdit className="h-4 w-4" />
                          </Link>
                        </Button>
                         <AlertDialog>
                          <AlertDialogTrigger asChild>
                             <Button variant="ghost" size="icon" disabled={isDeleting === post.id}>
                              {isDeleting === post.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                  <Trash2 className="h-4 w-4 text-destructive" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                              <AlertDialogDescription>
                                لا يمكن التراجع عن هذا الإجراء. سيؤدي هذا إلى حذف المقال بشكل دائم
                                "{post.title}".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>إلغاء</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(post.id)} className={buttonVariants({ variant: "destructive" })}>
                                حذف
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!loading && (!posts || posts.length === 0) && (
            <div className="text-center py-12 text-muted-foreground">
              <p>لم يتم العثور على مقالات.</p>
              <p>
                اذهب إلى صفحة "توليد مقال" لإنشاء مقالك الأول!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
