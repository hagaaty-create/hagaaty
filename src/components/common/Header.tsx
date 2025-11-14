'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bot, Menu, Search, X, LogOut, User, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth, useUser } from '@/firebase';
import { Skeleton } from '../ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { usePathname } from 'next/navigation';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, loading } = useUser();
  const auth = useAuth();
  const pathname = usePathname();
  
  const navLinks = [
    { href: '/', label: 'الرئيسية' },
    { href: '/blog', label: 'المدونة' },
  ];

  const handleLogout = () => {
    if (auth) {
      auth.signOut();
    }
  };

  const UserMenu = () => {
    if (loading) {
      return <Skeleton className="h-10 w-28" />;
    }

    if (!user) {
      return (
        <div className="hidden sm:flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/login">تسجيل الدخول</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">إنشاء حساب</Link>
          </Button>
        </div>
      );
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className='h-10 w-10'>
              {user.photoURL && <AvatarImage src={user.photoURL} alt={user.displayName || 'User'}/>}
              <AvatarFallback>{user.displayName?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal text-right">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.displayName}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/dashboard" className='justify-end'>
              <span>لوحة التحكم</span>
              <LayoutDashboard className="ml-2 h-4 w-4" />
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleLogout} className='justify-end'>
            <span>تسجيل الخروج</span>
            <LogOut className="ml-2 h-4 w-4" />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };
  
  // Don't show header on dashboard pages
  if (pathname.startsWith('/dashboard')) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg font-headline">حاجتي</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            {navLinks.map((link) => (
                <Link key={link.href} href={link.href} className="text-muted-foreground transition-colors hover:text-foreground">
                    {link.label}
                </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden sm:block">
             <Input placeholder="ابحث عن مقالات..." className="pl-4 pr-10 w-48 lg:w-64" />
             <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
          <UserMenu />

          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">فتح القائمة</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between border-b pb-4">
                         <Link href="/" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                            <Bot className="h-6 w-6 text-primary" />
                            <span className="font-bold">حاجتي</span>
                        </Link>
                    </div>
                    <nav className="flex flex-col gap-4 mt-8">
                        {navLinks.map((link) => (
                            <Link key={link.href} href={link.href} className="text-lg text-muted-foreground transition-colors hover:text-foreground" onClick={() => setIsMobileMenuOpen(false)}>
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                    { !user ? (
                     <div className="mt-auto flex flex-col gap-4">
                        <Button variant="outline" asChild><Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>تسجيل الدخول</Link></Button>
                        <Button asChild><Link href="/signup" onClick={() => setIsMobileMenuOpen(false)}>إنشاء حساب</Link></Button>
                    </div>
                    ) : (
                      <div className="mt-auto">
                        <Button className="w-full" onClick={() => {handleLogout(); setIsMobileMenuOpen(false);}}>
                           <LogOut className="ml-2 h-4 w-4" />
                           <span>تسجيل الخروج</span>
                        </Button>
                      </div>
                    )
                    }
                </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
