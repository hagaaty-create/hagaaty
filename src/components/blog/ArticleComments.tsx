'use client';

import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, serverTimestamp, doc } from "firebase/firestore";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Loader2, Send, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import type { Comment } from "@/types";
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";

type ArticleCommentsProps = {
    postId: string;
};

const CommentSkeleton = () => (
    <div className="flex items-start gap-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
        </div>
    </div>
);


export default function ArticleComments({ postId }: ArticleCommentsProps) {
    const firestore = useFirestore();
    const { user } = useUser();
    const [newComment, setNewComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const commentsQuery = useMemoFirebase(() => {
        if (!firestore || !postId) return null;
        return query(collection(firestore, 'posts', postId, 'comments'), orderBy('createdAt', 'desc'));
    }, [firestore, postId]);

    const { data: comments, isLoading } = useCollection<Comment>(commentsQuery);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore || !user || !newComment.trim()) return;

        setIsSubmitting(true);
        const commentsCollection = collection(firestore, 'posts', postId, 'comments');
        
        const commentData = {
            content: newComment,
            authorId: user.uid,
            authorName: user.displayName || "مستخدم مجهول",
            authorAvatar: user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`,
            createdAt: serverTimestamp(),
        };

        await addDocumentNonBlocking(commentsCollection, commentData);
        
        setNewComment("");
        setIsSubmitting(false);
    };

    const handleDelete = (commentId: string) => {
        if (!firestore) return;
        const commentRef = doc(firestore, 'posts', postId, 'comments', commentId);
        deleteDocumentNonBlocking(commentRef);
    }

    return (
        <Card className="mt-12">
            <CardHeader>
                <CardTitle>التعليقات ({comments?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
                {user ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="flex items-start gap-4">
                            <Avatar>
                                <AvatarImage src={user.photoURL || undefined} />
                                <AvatarFallback>{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                            <Textarea
                                placeholder="أضف تعليقًا..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                disabled={isSubmitting}
                                className="flex-1"
                            />
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit" disabled={isSubmitting || !newComment.trim()}>
                                {isSubmitting ? (
                                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="ml-2 h-4 w-4" />
                                )}
                                نشر التعليق
                            </Button>
                        </div>
                    </form>
                ) : (
                    <div className="text-center text-muted-foreground p-4 bg-muted/50 rounded-md">
                        <p>يجب عليك <a href="/login" className="underline font-bold">تسجيل الدخول</a> للتعليق.</p>
                    </div>
                )}

                <div className="space-y-6">
                    {isLoading && (
                       <div className="space-y-6">
                           <CommentSkeleton />
                           <CommentSkeleton />
                       </div>
                    )}
                    {!isLoading && comments && comments.length > 0 && comments.map((comment) => (
                        <div key={comment.id} className="flex items-start gap-4 group">
                            <Avatar>
                                <AvatarImage src={comment.authorAvatar} alt={comment.authorName} />
                                <AvatarFallback>{comment.authorName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold">{comment.authorName}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {comment.createdAt ? formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true, locale: ar }) : 'منذ فترة'}
                                        </p>
                                    </div>
                                    {user && (user.uid === comment.authorId || userProfile?.role === 'admin') && (
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => handleDelete(comment.id)}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive"/>
                                        </Button>
                                    )}
                                </div>
                                <p className="mt-2 text-sm text-foreground/90">{comment.content}</p>
                            </div>
                        </div>
                    ))}
                    {!isLoading && (!comments || comments.length === 0) && (
                         <div className="text-center text-muted-foreground py-8">
                            <p>لا توجد تعليقات بعد. كن أول من يعلق!</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
