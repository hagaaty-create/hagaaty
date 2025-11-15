'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Headphones } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateAudio } from '@/ai/flows/generate-audio';
import { Post } from '@/types';
import { marked } from 'marked';

type ArticleAudioGeneratorProps = {
  post: Post;
};

export default function ArticleAudioGenerator({ post }: ArticleAudioGeneratorProps) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const { toast } = useToast();

  const handleGenerateAudio = async () => {
    setIsGeneratingAudio(true);
    try {
      const plainText = marked.parse(post.content || '', {
        walkTokens(token) {
          if (token.type === 'space') {
            return false;
          }
        },
        renderer: {
          html: () => '',
          code: () => '',
          text(text) {
            return text;
          },
          paragraph(text) {
            return text + '\n\n';
          },
          heading(text, level) {
            return text + '\n\n';
          },
          listitem(text) {
            return ' - ' + text + '\n';
          },
          list(body, ordered, start) {
            return body + '\n';
          },
        },
      });

      const audioResult = await generateAudio({ text: `عنوان المقال: ${post.title}. \n\n ${plainText}` });
      setAudioUrl(audioResult.audioUrl);
    } catch (error) {
      console.error('Failed to generate audio:', error);
      toast({
        variant: 'destructive',
        title: 'فشل توليد الصوت',
        description: 'حدث خطأ أثناء محاولة تحويل المقال إلى صوت.',
      });
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  if (audioUrl) {
    return (
      <div className="p-4 bg-muted rounded-lg w-full max-w-md">
        <audio controls src={audioUrl} className="w-full">
          Your browser does not support the audio element.
        </audio>
      </div>
    );
  }

  return (
    <Button onClick={handleGenerateAudio} disabled={isGeneratingAudio} variant="outline">
      {isGeneratingAudio ? (
        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
      ) : (
        <Headphones className="ml-2 h-4 w-4" />
      )}
      <span>{isGeneratingAudio ? 'جاري توليد الصوت...' : 'استمع إلى المقال'}</span>
    </Button>
  );
}
