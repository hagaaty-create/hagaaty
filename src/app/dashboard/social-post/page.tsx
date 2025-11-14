// This is a new file

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Send, Wand2, Loader2, Upload } from 'lucide-react';
import { useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';

type SocialConnections = {
  [key: string]: boolean | undefined;
  facebook?: boolean;
  x?: boolean;
  instagram?: boolean;
  tiktok?: boolean;
  youtube?: boolean;
  threads?: boolean;
  linkedin?: boolean;
};

type UserProfile = {
  socialConnections?: SocialConnections;
}

const socialPlatforms = [
  { id: 'facebook', name: 'Facebook' },
  { id: 'x', name: 'X (Twitter)' },
  { id: 'instagram', name: 'Instagram' },
  { id: 'linkedin', name: 'LinkedIn' },
  { id: 'tiktok', name: 'TikTok' },
  { id: 'youtube', name: 'YouTube' },
  { id: 'threads', name: 'Threads' },
];

export default function SocialPostPage() {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const [postContent, setPostContent] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  
  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const { data: userProfile, loading: profileLoading } = useDoc<UserProfile>(userProfileRef);

  const connectedPlatforms = socialPlatforms.filter(p => userProfile?.socialConnections?.[p.id]);

  const handlePublish = async () => {
    if (!postContent.trim() || selectedPlatforms.length === 0) {
        toast({ variant: 'destructive', title: 'بيانات ناقصة', description: 'الرجاء كتابة محتوى المنشور واختيار منصة واحدة على الأقل.' });
        return;
    }
    setIsPublishing(true);
    // Simulate publishing
    await new Promise(resolve => setTimeout(resolve, 2000));
    toast({
      title: 'تم النشر (محاكاة)',
      description: `تم نشر منشورك على ${selectedPlatforms.join(', ')} بنجاح.`,
    });
    setIsPublishing(false);
  };
  
  const handleGenerate = async () => {
      setIsGenerating(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      setPostContent("اكتشف مستقبل التسويق مع منصة حاجتي للذكاء الاصطناعي! 🚀 أطلق حملاتك الإعلانية بضغطة زر، واحصل على محتوى سوشيال ميديا مبتكر، وحلل أدائك بدقة. #ذكاء_اصطناعي #تسويق_رقمي");
      setIsGenerating(false);
  }

  const handlePlatformChange = (platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Send className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold font-headline">إنشاء منشور اجتماعي</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>النشر عبر المنصات</CardTitle>
          <CardDescription>
            اكتب منشورك مرة واحدة، ودع الذكاء الاصطناعي ينشره على جميع حساباتك المرتبطة بضغطة زر.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="post-content">محتوى المنشور</Label>
            <div className="relative">
              <Textarea
                id="post-content"
                placeholder="ما الذي يدور في ذهنك؟"
                rows={8}
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                disabled={isPublishing || isGenerating}
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute bottom-2 left-2"
                onClick={handleGenerate}
                disabled={isPublishing || isGenerating}
              >
                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Wand2 className="mr-2 h-4 w-4" />}
                توليد بالذكاء الاصطناعي
              </Button>
            </div>
          </div>

          <div className="space-y-4">
             <Label>المنصات المرتبطة</Label>
             {profileLoading ? (
                 <Skeleton className="h-20 w-full" />
             ) : connectedPlatforms.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 rounded-md border p-4">
                    {connectedPlatforms.map(platform => (
                        <div key={platform.id} className="flex items-center space-x-2 space-x-reverse">
                            <Checkbox 
                                id={platform.id}
                                onCheckedChange={() => handlePlatformChange(platform.id)}
                                checked={selectedPlatforms.includes(platform.id)}
                            />
                            <label
                                htmlFor={platform.id}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                {platform.name}
                            </label>
                        </div>
                    ))}
                </div>
             ) : (
                <p className="text-sm text-muted-foreground">لم تقم بربط أي حسابات بعد. <a href="/dashboard/social-connect" className="text-primary underline">اربط حساباتك الآن</a>.</p>
             )}
          </div>
          
           <div className="space-y-2">
              <Label>إرفاق وسائط (اختياري)</Label>
              <div className="flex gap-4">
                <Button variant="outline" asChild>
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <Upload className="mr-2 h-4 w-4" />
                    تحميل صورة
                    <input id="image-upload" type="file" className="sr-only" accept="image/*" />
                  </label>
                </Button>
                 <Button variant="outline" asChild>
                  <label htmlFor="video-upload" className="cursor-pointer">
                    <Upload className="mr-2 h-4 w-4" />
                    تحميل فيديو
                    <input id="video-upload" type="file" className="sr-only" accept="video/*" />
                  </label>
                </Button>
              </div>
           </div>

          <Button
            onClick={handlePublish}
            disabled={isPublishing || isGenerating || selectedPlatforms.length === 0 || !postContent.trim()}
          >
            {isPublishing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            نشر الآن (محاكاة)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
