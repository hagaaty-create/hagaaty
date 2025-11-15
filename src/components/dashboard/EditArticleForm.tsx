'use client';

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { useFirestore } from "@/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import type { Post } from "@/types";
import { useRouter } from "next/navigation";
import { Badge } from "../ui/badge";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";

type EditArticleFormProps = {
  post: Post;
};

export default function EditArticleForm({ post }: EditArticleFormProps) {
    const [title, setTitle] = useState(post.title);
    const [content, setContent] = useState(post.content);
    const [category, setCategory] = useState(post.category);
    const [tags, setTags] = useState(post.tags.join(', '));
    const [isSaving, setIsSaving] = useState(false);
    
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore) return;
        
        setIsSaving(true);
        const postRef = doc(firestore, 'posts', post.id);
        const updatedSlug = title.toLowerCase().replace(/[^a-z0-9\u0621-\u064A]+/g, '-').replace(/(^-|-$)/g, '');
        
        const updatedData = {
          title,
          content,
          slug: updatedSlug,
          category,
          tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
          date: serverTimestamp(), // To update the modification date
        };

        // Non-blocking update using the new centralized function
        updateDocumentNonBlocking(postRef, updatedData);

        toast({
            title: "جاري حفظ التحديثات...",
            description: "سيتم تحديث المقال في الخلفية.",
        });

        // Optimistically navigate away
        router.push('/dashboard/admin/articles');
        router.refresh(); // Tell Next.js to refetch server components for the target page
        
        // We don't set isSaving to false here because we've already navigated away.
    };
    
    return (
        <form onSubmit={handleSave} className="space-y-6">
            <div className="grid w-full gap-2">
                <Label htmlFor="title">العنوان</Label>
                <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={isSaving}
                    className="font-bold text-lg"
                />
            </div>
            <div className="grid w-full gap-2">
                <Label htmlFor="content">المحتوى</Label>
                <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={20}
                    disabled={isSaving}
                    className="prose dark:prose-invert prose-p:leading-relaxed"
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="grid w-full gap-2">
                    <Label htmlFor="category">الفئة</Label>
                    <Input
                        id="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        disabled={isSaving}
                    />
                </div>
                 <div className="grid w-full gap-2">
                    <Label htmlFor="tags">الوسوم (مفصولة بفاصلة)</Label>
                    <Input
                        id="tags"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        disabled={isSaving}
                    />
                </div>
            </div>
            <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        جاري الحفظ...
                    </>
                ) : (
                    <>
                        <Save className="mr-2 h-4 w-4" />
                        حفظ التغييرات
                    </>
                )}
            </Button>
        </form>
    );
}
