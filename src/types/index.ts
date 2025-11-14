import { Timestamp } from 'firebase/firestore';

export type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  imageHint: string;
  author: {
    name: string;
    avatarUrl: string;
  };
  date: string | Timestamp; // Allow both string and Timestamp for flexibility
  category: string;
  tags: string[];
};
