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
import { FileText, Trash2, Loader2 } from 'lucide-react';
import type { Post } from '@/types';
import { useToast } from '@/hooks/use-toast';

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
        title: 'Article Deleted',
        description: 'The article has been successfully removed.',
      });
    } catch (error) {
      console.error('Error deleting article:', error);
      toast({
        variant: 'destructive',
        title: 'Deletion Failed',
        description: 'Could not delete the article. Please try again.',
      });
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <FileText className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold font-headline">Manage Articles</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Blog Posts</CardTitle>
          <CardDescription>
            View, edit, or delete existing blog posts.
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
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the article
                              "{post.title}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(post.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!loading && (!posts || posts.length === 0) && (
            <div className="text-center py-12 text-muted-foreground">
              <p>No articles found.</p>
              <p>
                Go to the "Generate Article" page to create your first one!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
