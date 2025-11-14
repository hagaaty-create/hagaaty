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
  Lightbulb
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
import { useUser, useAuth } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import React from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, loading } = useUser();
  const auth = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);


  const userNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/create-ad', label: 'Create Ad', icon: PenSquare },
    { href: '/dashboard/campaigns', label: 'My Campaigns', icon: BarChart },
  ];
  
  const adminNavItems = [
    { href: '/dashboard/admin/generate', label: 'Generate Article', icon: PenSquare },
    { href: '/dashboard/admin/articles', label: 'Manage Articles', icon: FileText },
    { href: '/dashboard/admin/insights', label: 'Content Insights', icon: Lightbulb },
  ];

  const handleLogout = () => {
    if (auth) {
      auth.signOut();
      router.push('/');
    }
  };
  
  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Skeleton className="h-screen w-full" />
      </div>
    );
  }

  // A simple check to show admin section. In a real app, this would be based on user roles.
  const isAdmin = user?.email === 'hagaaty@gmail.com';


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
                          <span>Admin</span>
                      </SidebarGroupLabel>
                      <SidebarMenu>
                           {adminNavItems.map((item) => (
                              <SidebarMenuItem key={item.href}>
                                  <Link href={item.href}>
                                      <SidebarMenuButton
                                          isActive={pathname.startsWith(item.href)}
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
                             <SidebarMenuButton tooltip="Back to Home">
                                <Home />
                                <span>Back to Home</span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                         <SidebarMenuButton tooltip="Logout" onClick={handleLogout}>
                            <LogOut />
                            <span>Logout</span>
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
