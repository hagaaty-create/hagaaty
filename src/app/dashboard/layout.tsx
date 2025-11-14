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
import { useUser, useAuth, useDoc, useFirestore } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import React, { useMemo } from 'react';
import { doc } from 'firebase/firestore';

type UserProfile = {
  role?: 'admin' | 'user';
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, loading: userLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();

  const userProfileRef = useMemo(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
  
  const { data: userProfile, loading: profileLoading } = useDoc<UserProfile>(userProfileRef);

  React.useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
    }
  }, [user, userLoading, router]);


  const userNavItems = [
    { href: '/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { href: '/dashboard/create-ad', label: 'إنشاء إعلان', icon: PenSquare },
    { href: '/dashboard/campaigns', label: 'حملاتي', icon: BarChart },
  ];
  
  const adminNavItems = [
    { href: '/dashboard/admin/generate', label: 'توليد مقال', icon: PenSquare },
    { href: '/dashboard/admin/articles', label: 'إدارة المقالات', icon: FileText, matchStartsWith: true },
    { href: '/dashboard/admin/insights', label: 'رؤى المحتوى', icon: Lightbulb },
    { href: '/dashboard/admin/campaigns', label: 'كل الحملات', icon: Users },
    { href: '/dashboard/admin/auto-marketing', label: 'التسويق الآلي', icon: Megaphone },
  ];

  const handleLogout = () => {
    if (auth) {
      auth.signOut();
      router.push('/');
    }
  };
  
  const loading = userLoading || profileLoading;

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full bg-background">
        <div className='hidden md:block'>
          <Skeleton className="h-full w-[16rem]" />
        </div>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
           <Skeleton className="h-full w-full" />
        </main>
      </div>
    );
  }

  const isAdmin = userProfile?.role === 'admin';


  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar>
            <SidebarHeader>
                <div className="flex items-center gap-2 p-2">
                    <Avatar>
                        {user.photoURL && <AvatarImage src={user.photoURL} alt={user.displayName || 'User'}/>}
                        <AvatarFallback>{user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="text-sm overflow-hidden text-sidebar-foreground">
                        <p className="font-semibold truncate">{user.displayName || 'User Name'}</p>
                        <p className="text-muted-foreground truncate">{user.email}</p>
                    </div>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                    {userNavItems.map((item) => (
                        <SidebarMenuItem key={item.href}>
                            <Link href={item.href}>
                                <SidebarMenuButton
                                    isActive={pathname === item.href}
                                    tooltip={item.label}
                                >
                                    <item.icon />
                                    <span>{item.label}</span>
                                </SidebarMenuButton>
                            </Link>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
                
                {isAdmin && (
                  <>
                  <SidebarSeparator />
                  <SidebarGroup>
                      <SidebarGroupLabel className="flex items-center gap-2">
                          <Shield />
                          <span>مسؤول</span>
                      </SidebarGroupLabel>
                      <SidebarMenu>
                           {adminNavItems.map((item) => (
                              <SidebarMenuItem key={item.href}>
                                  <Link href={item.href}>
                                      <SidebarMenuButton
                                          isActive={item.matchStartsWith ? pathname.startsWith(item.href) : pathname === item.href}
                                          tooltip={item.label}
                                      >
                                          <item.icon />
                                          <span>{item.label}</span>
                                      </SidebarMenuButton>
                                  </Link>
                              </SidebarMenuItem>
                          ))}
                      </SidebarMenu>
                  </SidebarGroup>
                  </>
                )}

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
