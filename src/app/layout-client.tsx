'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import SmartAssistant from '@/components/chat/SmartAssistant';
import { Toaster } from '@/components/ui/toaster';

export default function RootLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isEmbedPage = pathname === '/assistant';

  if (isEmbedPage) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <SmartAssistant />
      <Toaster />
    </div>
  );
}
