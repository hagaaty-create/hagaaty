'use client';

import { useState, useEffect } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

type CampaignReviewProgressProps = {
  campaignId: string;
};

const REVIEW_DURATION_SECONDS = 10; // Reduced for better demo experience

export default function CampaignReviewProgress({ campaignId }: CampaignReviewProgressProps) {
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 100 / REVIEW_DURATION_SECONDS;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress >= 100 && !isComplete) {
      setIsComplete(true);
      if (firestore && user) {
        const campaignRef = doc(firestore, 'users', user.uid, 'campaigns', campaignId);
        updateDoc(campaignRef, { status: 'active' })
          .then(() => {
            toast({
              title: 'تم تفعيل الحملة!',
              description: 'تمت مراجعة حملتك بنجاح وهي الآن نشطة.',
            });
          })
          .catch(error => {
            console.error('Error updating campaign status:', error);
            toast({
              variant: 'destructive',
              title: 'خطأ في التفعيل',
              description: 'حدث خطأ أثناء تفعيل حملتك.',
            });
          });
      }
    }
  }, [progress, isComplete, firestore, user, campaignId, toast]);

  if (isComplete) {
    return <Badge variant="default">نشطة</Badge>;
  }

  return (
    <div className="w-full flex items-center gap-2" dir="ltr">
      <span className="text-xs text-muted-foreground font-mono">{Math.round(progress)}%</span>
      <Progress value={progress} className="w-20 h-2" />
    </div>
  );
}
