import Link from 'next/link';
import { Bot, Mail, Github } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            <span className="font-bold font-headline">مدونة حاجتي للذكاء الاصطناعي</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} حاجتي AI. جميع الحقوق محفوظة.
          </p>
          <div className="flex items-center gap-4">
            <Link href="mailto:hagaaty@gmail.com" aria-label="الدعم الفني">
              <Mail className="h-5 w-5 text-muted-foreground transition-colors hover:text-foreground" />
            </Link>
            <Link href="https://github.com/firebase/studio" aria-label="GitHub" target="_blank">
              <Github className="h-5 w-5 text-muted-foreground transition-colors hover:text-foreground" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
