import type { Metadata } from 'next';
import { Tajawal } from 'next/font/google';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import RootLayoutClient from './layout-client';
import GoogleAnalytics from '@/components/common/GoogleAnalytics';

const tajawal = Tajawal({
  subsets: ['arabic'],
  weight: ['400', '500', '700', '800'],
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
    <html lang="ar" dir="rtl" className="light" suppressHydrationWarning>
      <body className={`${tajawal.variable} font-body antialiased`}>
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        <FirebaseClientProvider>
          <RootLayoutClient>{children}</RootLayoutClient>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
