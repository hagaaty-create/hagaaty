'use server';

import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { initializeFirebase as initializeServerFirebase } from '@/firebase/server-initialization';
import { notFound } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, DollarSign, Trophy, Shield, Bot, Share2, PenSquare } from 'lucide-react';
import { format } from 'date-fns';


type UserProfile = {
  id: string;
  displayName: string;
  email: string;
  balance?: number;
  referralEarnings?: number;
  achievements?: { id: string, name: string, awardedAt: Timestamp }[];
};

type AchievementIconMap = {
    [key: string]: React.ReactNode;
}

const achievementIcons: AchievementIconMap = {
    'ad_pioneer': <PenSquare className="h-6 w-6 text-blue-500" />,
    'team_builder': <Share2 className="h-6 w-6 text-green-500" />,
    'ai_contributor': <Bot className="h-6 w-6 text-purple-500" />,
    'reward_earner': <Award className="h-6 w-6 text-yellow-500" />,
};


async function getUserProfile(id: string): Promise<UserProfile | null> {
  const { firestore } = initializeServerFirebase();
  const userRef = doc(firestore, 'users', id);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    return null;
  }

  return { id: userSnap.id, ...userSnap.data() } as UserProfile;
}

export default async function UserProfilePage({ params }: { params: { id: string } }) {
  const userProfile = await getUserProfile(params.id);

  if (!userProfile) {
    notFound();
  }
  
  const achievements = userProfile.achievements?.sort((a, b) => b.awardedAt.toMillis() - a.awardedAt.toMillis()) || [];

  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
      <div className="flex flex-col items-center text-center space-y-4 mb-12">
        <Avatar className="h-24 w-24 border-4 border-primary shadow-lg">
          <AvatarImage src={`https://i.pravatar.cc/150?u=${userProfile.id}`} alt={userProfile.displayName} />
          <AvatarFallback className="text-3xl">{userProfile.displayName.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
            <h1 className="text-4xl font-bold font-headline">{userProfile.displayName}</h1>
            <p className="text-muted-foreground">{userProfile.email}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">الرصيد الإعلاني</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">${(userProfile.balance || 0).toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">يستخدم لإطلاق الحملات الإعلانية.</p>
            </CardContent>
        </Card>
         <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">أرباح الشبكة</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">${(userProfile.referralEarnings || 0).toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">الأرباح من عمولات فريقك.</p>
            </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
             <Shield className="h-6 w-6 text-primary"/>
             <span>الإنجازات</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {achievements.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {achievements.map((ach) => (
                <div key={ach.id} className="flex flex-col items-center text-center p-4 border rounded-lg bg-muted/50 space-y-2">
                  <div className="p-3 bg-primary/10 rounded-full">
                     {achievementIcons[ach.id] || <Award className="h-6 w-6 text-primary" />}
                  </div>
                  <p className="font-bold text-sm">{ach.name}</p>
                  <p className="text-xs text-muted-foreground">{format(ach.awardedAt.toDate(), 'PPP')}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>لم يحصل هذا المستخدم على أي إنجازات بعد.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
