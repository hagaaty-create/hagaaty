import type { Metadata } from 'next';
import { Tajawal } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import SmartAssistant from '@/components/chat/SmartAssistant';
import { FirebaseClientProvider } from '@/firebase/client-provider';

const tajawal = Tajawal({
  subsets: ['arabic'],
  weight: ['400', '700'],
  variable: '--font-tajawal',
});

export const metadata: Metadata = {
  title: 'منصة حاجتي للذكاء الاصطناعي',
  description: 'منصة إعلانية وتسويقية مدعومة بالذكاء الاصطناعي.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${tajawal.variable} font-body antialiased`}>
        <FirebaseClientProvider>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <SmartAssistant />
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
