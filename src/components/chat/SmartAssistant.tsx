'use client';

import { smartAssistantChat } from '@/ai/flows/smart-assistant-chat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Bot, Loader2, Send, User, Sparkles } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { cn } from '@/lib/utils';
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';


type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function SmartAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const firestore = useFirestore();

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !firestore) return;

    const currentQuery = input;
    const userMessage: Message = { role: 'user', content: currentQuery };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
        // Log the query to Firestore first, don't wait for it
        const queriesRef = collection(firestore, 'queries');
        addDoc(queriesRef, {
            query: currentQuery,
            createdAt: serverTimestamp()
        }).catch(err => console.error("Failed to log query:", err));
        
        // Then get the response
        const result = await smartAssistantChat({ query: currentQuery });
        const assistantMessage: Message = { role: 'assistant', content: result.response };
        setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        role: 'assistant',
        content: 'عذراً، لقد واجهت خطأ. يرجى المحاولة مرة أخرى.',
      };
      setMessages(prev => [...prev, errorMessage]);
      console.error('Error with smart assistant:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages]);

  const exampleQueries = [
    "ما هو الذكاء الاصطناعي التوليدي؟",
    "كيف تعمل الحوسبة الكمومية؟",
    "ما هي مبادئ تصميم واجهة المستخدم الجيدة؟"
  ];
  
  const handleExampleQuery = (query: string) => {
    if (!firestore) return;
    const userMessage: Message = { role: 'user', content: query };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    addDoc(collection(firestore, 'queries'), {
        query: query,
        createdAt: serverTimestamp()
    }).catch(err => console.error("Failed to log query:", err));

    smartAssistantChat({ query: query })
      .then(result => {
        setMessages(prev => [...prev, { role: 'assistant', content: result.response }]);
      })
      .catch(err => {
        setMessages(prev => [...prev, { role: 'assistant', content: 'عذراً، حدثت مشكلة. يرجى المحاولة مرة أخرى.'}]);
        console.error(err);
      })
      .finally(() => setIsLoading(false));
  };


  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg"
          size="icon"
          aria-label="Open Smart Assistant"
        >
          <Bot className="h-8 w-8" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0" aria-label="المساعد الذكي">
        <SheetHeader className="p-6 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="font-headline">المساعد الذكي</span>
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="flex-1" ref={scrollAreaRef}>
          <div className="p-4 sm:p-6 space-y-6">
            {messages.length === 0 && (
                <div className="text-center text-muted-foreground p-4 sm:p-8">
                    <Bot className="mx-auto h-12 w-12 mb-4 text-primary/50"/>
                    <p className='mb-6'>مرحباً! أنا مساعد حاجتي للذكاء الاصطناعي. اسألني أي شيء عن المقالات في هذه المدونة.</p>
                    <div className='flex flex-col items-center gap-2'>
                        {exampleQueries.map((q) => (
                           <Button 
                             key={q}
                             variant="outline"
                             size="sm"
                             className="w-full"
                             onClick={() => handleExampleQuery(q)}
                           >
                            {q}
                           </Button>
                        ))}
                    </div>
                </div>
            )}
            {messages.map((message, index) => (
              <div key={index} className={cn('flex items-start gap-3', message.role === 'user' ? 'justify-end' : '')}>
                {message.role === 'assistant' && (
                  <Avatar className="h-8 w-8 border bg-primary/10 text-primary">
                    <AvatarFallback><Sparkles size={16}/></AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    'max-w-[85%] rounded-lg p-3 text-sm whitespace-pre-wrap',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  {message.content}
                </div>
                 {message.role === 'user' && (
                  <Avatar className="h-8 w-8 border">
                    <AvatarFallback><User size={16}/></AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-3">
                 <Avatar className="h-8 w-8 border bg-primary/10 text-primary">
                    <AvatarFallback><Sparkles size={16}/></AvatarFallback>
                  </Avatar>
                <div className="bg-muted rounded-lg p-3 flex items-center">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="p-4 border-t bg-background">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="اطرح سؤالاً..."
              autoComplete="off"
              disabled={isLoading}
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
