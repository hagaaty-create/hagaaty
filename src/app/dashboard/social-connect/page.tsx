'use client';

import { useState, useEffect } from 'react';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Share2, Check, Link as LinkIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

// A more specific type for the social connections part of the user profile
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

// A more specific type for the user profile document
type UserProfile = {
    socialConnections?: SocialConnections;
}

const socialPlatforms = [
  { id: 'facebook', name: 'Facebook', icon: 'https://img.icons8.com/fluent/48/000000/facebook-new.png' },
  { id: 'x', name: 'X (Twitter)', icon: 'https://img.icons8.com/ios-filled/50/000000/twitterx.png' },
  { id: 'instagram', name: 'Instagram', icon: 'https://img.icons8.com/fluent/48/000000/instagram-new.png' },
  { id: 'linkedin', name: 'LinkedIn', icon: 'https://img.icons8.com/fluent/48/000000/linkedin.png' },
  { id: 'tiktok', name: 'TikTok', icon: 'https://img.icons8.com/ios-filled/50/000000/tiktok.png' },
  { id: 'youtube', name: 'YouTube', icon: 'https://img.icons8.com/color/48/000000/youtube-play.png' },
  { id: 'threads', name: 'Threads', icon: 'https://img.icons8.com/ios-filled/50/000000/threads.png' },
];

export default function SocialConnectPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [connectingId, setConnectingId] = useState<string | null>(null);

  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const { data: userProfile, loading: profileLoading } = useDoc<UserProfile>(userProfileRef);

  const handleConnect = async (platformId: string) => {
    if (!userProfileRef) return;
    setConnectingId(platformId);

    // Simulate API call for OAuth
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      await updateDoc(userProfileRef, {
        [`socialConnections.${platformId}`]: true,
      });
      toast({
        title: 'تم الربط بنجاح! (محاكاة)',
        description: `تم ربط حسابك على ${socialPlatforms.find(p => p.id === platformId)?.name}. الآن يمكنك النشر عليه من خلال المنصة.`,
      });
    } catch (error) {
      // If the document or socialConnections field doesn't exist, create it.
      if (error instanceof Error && (error.message.includes('No document to update') || error.message.includes("is not an object"))) {
         try {
            await setDoc(userProfileRef, { 
              socialConnections: { [platformId]: true } 
            }, { merge: true });
             toast({
                title: 'تم الربط بنجاح! (محاكاة)',
                description: `تم ربط حسابك على ${socialPlatforms.find(p => p.id === platformId)?.name}.`,
            });
         } catch (e) {
            console.error('Failed to set document:', e);
            toast({ variant: 'destructive', title: 'فشل الربط', description: 'حدث خطأ غير متوقع.' });
         }
      } else {
        console.error('Failed to connect:', error);
        toast({ variant: 'destructive', title: 'فشل الربط', description: 'حدث خطأ غير متوقع.' });
      }
    } finally {
      setConnectingId(null);
    }
  };


  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Share2 className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold font-headline">ربط حسابات التواصل الاجتماعي</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>أتمتة التسويق عبر المنصات</CardTitle>
          <CardDescription>
            اربط حساباتك لنشر المحتوى الذي ينشئه الذكاء الاصطناعي على جميع منصاتك بضغطة زر واحدة.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {profileLoading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {socialPlatforms.map(platform => {
                const isConnected = userProfile?.socialConnections?.[platform.id] === true;
                const isLoading = connectingId === platform.id;
                return (
                  <Card key={platform.id} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <img src={platform.icon} alt={platform.name} className="h-8 w-8" />
                      <span className="font-semibold">{platform.name}</span>
                    </div>
                    <Button
                      variant={isConnected ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => !isConnected && handleConnect(platform.id)}
                      disabled={isLoading || isConnected}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isConnected ? (
                        <>
                          <Check className="mr-2 h-4 w-4 text-green-500" />
                          تم الربط
                        </>
                      ) : (
                        <>
                          <LinkIcon className="mr-2 h-4 w-4" />
                          ربط
                        </>
                      )}
                    </Button>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
