
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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, FileText, BarChart, PenSquare, Shield, Loader2, ArrowLeft, Lightbulb, Megaphone, ImageIcon, Video } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, collectionGroup } from 'firebase/firestore';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import type { Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';

type UserProfile = {
  id: string;
  displayName: string;
  email: string;
  createdAt: Timestamp;
};

type Post = {
  id: string;
  title: string;
  slug: string;
  category: string;
  date: Timestamp;
};

type Campaign = {
    id: string;
}

const StatCard = ({ title, value, icon, isLoading }: { title: string, value: number, icon: React.ReactNode, isLoading: boolean }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <Skeleton className="h-8 w-20" />
            ) : (
                <div className="text-2xl font-bold">{value.toLocaleString()}</div>
            )}
        </CardContent>
    </Card>
);

export default function AdminDashboardPage() {
  const firestore = useFirestore();

  // Queries
  const usersQuery = useMemoFirebase(() => 
    !firestore ? null : query(collection(firestore, 'users'), orderBy('createdAt', 'desc'), limit(5)),
    [firestore]
  );
  const postsQuery = useMemoFirebase(() => 
    !firestore ? null : query(collection(firestore, 'posts'), orderBy('date', 'desc'), limit(5)),
    [firestore]
  );

  const allUsersQuery = useMemoFirebase(() => !firestore ? null : collection(firestore, 'users'), [firestore]);
  const allPostsQuery = useMemoFirebase(() => !firestore ? null : collection(firestore, 'posts'), [firestore]);
  const allCampaignsQuery = useMemoFirebase(() => !firestore ? null : collectionGroup(firestore, 'campaigns'), [firestore]);


  // Data fetching
  const { data: latestUsers, isLoading: usersLoading } = useCollection<UserProfile>(usersQuery);
  const { data: latestPosts, isLoading: postsLoading } = useCollection<Post>(postsQuery);

  const { data: allUsers, isLoading: allUsersLoading } = useCollection(allUsersQuery);
  const { data: allPosts, isLoading: allPostsLoading } = useCollection(allPostsQuery);
  const { data: allCampaigns, isLoading: allCampaignsLoading } = useCollection(allCampaignsQuery);
  
  const isLoading = usersLoading || postsLoading || allUsersLoading || allPostsLoading || allCampaignsLoading;

  const formatDate = (timestamp: Timestamp | null) => {
    if (!timestamp) return 'N/A';
    return format(timestamp.toDate(), 'PPP');
  };

  const quickLinks = [
    { href: '/dashboard/admin/generate', label: 'توليد مقال جديد', icon: PenSquare },
    { href: '/dashboard/admin/generate-image', label: 'توليد صورة', icon: ImageIcon },
    { href: '/dashboard/admin/generate-video', label: 'توليد فيديو', icon: Video },
    { href: '/dashboard/admin/insights', label: 'رؤى المحتوى', icon: Lightbulb },
    { href: '/dashboard/admin/auto-marketing', label: 'التسويق الآلي', icon: Megaphone },
    { href: '/dashboard/admin/articles', label: 'إدارة المقالات', icon: FileText },
    { href: '/dashboard/admin/users', label: 'إدارة المستخدمين', icon: Users },
    { href: '/dashboard/admin/campaigns', label: 'جميع الحملات', icon: BarChart },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Shield className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold font-headline">لوحة تحكم المسؤول</h1>
      </div>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatCard title="إجمالي المستخدمين" value={allUsers?.length || 0} icon={<Users className="h-4 w-4 text-muted-foreground" />} isLoading={allUsersLoading} />
          <StatCard title="إجمالي المقالات" value={allPosts?.length || 0} icon={<FileText className="h-4 w-4 text-muted-foreground" />} isLoading={allPostsLoading} />
          <StatCard title="إجمالي الحملات" value={allCampaigns?.length || 0} icon={<BarChart className="h-4 w-4 text-muted-foreground" />} isLoading={allCampaignsLoading} />
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>روابط سريعة</CardTitle>
                <CardDescription>انتقل إلى أهم أدوات الإدارة.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
                {quickLinks.map(link => (
                    <Button key={link.href} asChild variant="outline" className="justify-between h-12 text-base">
                        <Link href={link.href}>
                            <div className="flex items-center gap-3">
                                <link.icon className="h-5 w-5 text-primary" />
                                <span>{link.label}</span>
                            </div>
                            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
                        </Link>
                    </Button>
                ))}
            </CardContent>
        </Card>
         <Card>
           <CardHeader>
             <CardTitle>أحدث المستخدمين</CardTitle>
             <CardDescription>آخر 5 مستخدمين انضموا للمنصة.</CardDescription>
           </CardHeader>
           <CardContent>
             {usersLoading ? (
                 <div className="space-y-2">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                 </div>
             ) : (
                <Table>
                    <TableBody>
                        {latestUsers?.map(user => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.displayName}</TableCell>
                                <TableCell className="text-right text-muted-foreground">{formatDate(user.createdAt)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
             )}
           </CardContent>
        </Card>
      </div>

       <Card>
           <CardHeader>
             <CardTitle>أحدث المقالات</CardTitle>
             <CardDescription>آخر 5 مقالات تم إنشاؤها في المدونة.</CardDescription>
           </CardHeader>
           <CardContent>
             {postsLoading ? (
                 <div className="space-y-2">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                 </div>
             ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>العنوان</TableHead>
                            <TableHead>الفئة</TableHead>
                            <TableHead className="text-right">تاريخ النشر</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {latestPosts?.map(post => (
                            <TableRow key={post.id}>
                                <TableCell className="font-medium">
                                    {post.title}
                                </TableCell>
                                <TableCell><Badge variant="secondary">{post.category}</Badge></TableCell>
                                <TableCell className="text-right">{formatDate(post.date)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
             )}
           </CardContent>
        </Card>
    </div>
  );
}
