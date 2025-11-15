'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  PenSquare,
  Home,
  LogOut,
  BarChart,
  Shield,
  FileText,
  Lightbulb,
  Users,
  Megaphone,
  ImageIcon,
  Bot,
  Share2,
  Wallet,
  Landmark,
  Sparkles,
  Trophy,
  Banknote,
  Video,
} from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarSeparator,
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUser, useAuth, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import React, { useMemo } from 'react';
import { doc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

type UserProfile = {
  role?: 'admin' | 'user';
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();

  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
  
  const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfile>(userProfileRef);

  React.useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const isAdmin = userProfile?.role === 'admin';

  React.useEffect(() => {
      if (!profileLoading && isAdmin && pathname === '/dashboard') {
          router.replace('/dashboard/admin');
      }
  }, [isAdmin, profileLoading, pathname, router]);

  const userNavItems = [
    { href: '/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { href: '/dashboard/create-ad', label: 'إنشاء إعلان', icon: PenSquare },
    { href: '/dashboard/campaigns', label: 'حملاتي', icon: BarChart },
    { href: '/dashboard/billing', label: 'شحن الرصيد', icon: Wallet },
    { href: '/dashboard/agent', label: 'الوكيل المستقل', icon: Bot },
    { href: '/dashboard/referrals', label: 'برنامج الإحالة', icon: Share2 },
    { href: '/dashboard/leaderboard', label: 'لوحة الصدارة', icon: Trophy },
    { href: '/dashboard/marketing-tools', label: 'أدوات التسويق', icon: Sparkles },
    { href: '/dashboard/withdraw', label: 'سحب الأرباح', icon: Banknote },
  ];
  
  const adminNavItems = [
    { href: '/dashboard/admin', label: 'لوحة تحكم المسؤول', icon: Shield },
    { href: '/dashboard/admin/generate', label: 'توليد مقال', icon: PenSquare },
    { href: '/dashboard/admin/generate-image', label: 'توليد صورة', icon: ImageIcon },
    { href: '/dashboard/admin/generate-video', label: 'توليد فيديو', icon: Video },
    { href: '/dashboard/admin/insights', label: 'رؤى المحتوى', icon: Lightbulb },
    { href: '/dashboard/admin/articles', label: 'إدارة المقالات', icon: FileText, matchStartsWith: true },
    { href: '/dashboard/admin/users', label: 'إدارة المستخدمين', icon: Users, matchStartsWith: true },
    { href: '/dashboard/admin/campaigns', label: 'جميع الحملات', icon: BarChart },
    { href: '/dashboard/admin/auto-marketing', label: 'التسويق الآلي', icon: Megaphone },
  ];

  const handleLogout = () => {
    if (auth) {
      auth.signOut();
      router.push('/');
    }
  };
  
  const loading = isUserLoading || profileLoading;

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full bg-background">
        <div className='hidden md:block'>
          <Skeleton className="h-full w-64" />
        </div>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
           <Skeleton className="h-full w-full" />
        </main>
      </div>
    );
  }

  if (isAdmin && pathname === '/dashboard') {
    return (
         <div className="flex h-screen w-full bg-background items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar>
            <SidebarHeader>
                <div className="flex items-center gap-3 p-2">
                    <Avatar className='size-10'>
                        {user.photoURL && <AvatarImage src={user.photoURL} alt={user.displayName || 'User'}/>}
                        <AvatarFallback>{user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="text-sm overflow-hidden text-sidebar-foreground">
                        <p className="font-semibold truncate">{user.displayName || 'User Name'}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                </div>
            </SidebarHeader>
            <SidebarContent>
              <SidebarMenu>
                 <SidebarGroup>
                    {isAdmin && <SidebarGroupLabel>المستخدم</SidebarGroupLabel>}
                    {userNavItems.map((item) => (
                        <SidebarMenuItem key={item.href}>
                            <Link href={item.href}>
                                <SidebarMenuButton
                                    isActive={pathname === item.href}
                                    tooltip={item.label}
                                    size='lg'
                                >
                                    <item.icon />
                                    <span>{item.label}</span>
                                </SidebarMenuButton>
                            </Link>
                        </SidebarMenuItem>
                    ))}
                  </SidebarGroup>
                 
                 {isAdmin && (
                   <SidebarGroup>
                      <SidebarGroupLabel className="flex items-center gap-2">
                          <span>المسؤول</span>
                      </SidebarGroupLabel>
                      <SidebarMenu>
                           {adminNavItems.map((item) => (
                              <SidebarMenuItem key={item.href}>
                                  <Link href={item.href}>
                                      <SidebarMenuButton
                                          isActive={item.matchStartsWith ? pathname.startsWith(item.href) : pathname === item.href}
                                          tooltip={item.label}
                                          size='lg'
                                      >
                                          <item.icon />
                                          <span>{item.label}</span>
                                      </SidebarMenuButton>
                                  </Link>
                              </SidebarMenuItem>
                          ))}
                      </SidebarMenu>
                  </SidebarGroup>
                 )}
              </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <Link href="/">
                             <SidebarMenuButton tooltip="العودة للرئيسية">
                                <Home />
                                <span>العودة للرئيسية</span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                         <SidebarMenuButton tooltip="تسجيل الخروج" onClick={handleLogout}>
                            <LogOut />
                            <span>تسجيل الخروج</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
            {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
