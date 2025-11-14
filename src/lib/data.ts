import type { Post } from '@/types';
import { PlaceHolderImages } from './placeholder-images';


const getPlaceholderImage = (hint: string) => {
    const image = PlaceHolderImages.find(img => img.imageHint.includes(hint));
    return image ? image.imageUrl : 'https://picsum.photos/seed/placeholder/1200/800';
}

export const posts: Post[] = [
  {
    id: '1',
    slug: 'the-rise-of-generative-ai',
    title: 'The Rise of Generative AI and Its Impact on Content Creation',
    excerpt: 'Explore how generative AI is revolutionizing the way we create content, from text to images and beyond.',
    content: `Generative AI is not just a buzzword; it's a transformative technology that is reshaping industries. In this article, we delve deep into the mechanics of generative models like GPT-3 and DALL-E, and discuss their profound implications for content creators, marketers, and businesses.

We'll cover the history of generative models, their underlying architecture, and the ethical considerations that come with their widespread adoption. Join us on this journey to understand the future of automated creativity. The possibilities are endless, but so are the challenges. How do we ensure fairness, prevent misuse, and maintain human oversight in an increasingly automated world? These are the questions we must answer as we embrace this new era.`,
    imageUrl: getPlaceholderImage('abstract network'),
    imageHint: 'abstract network',
    author: {
      name: 'AI Author 1',
      avatarUrl: 'https://picsum.photos/seed/avatar1/40/40',
    },
    date: '2024-05-15',
    category: 'AI',
    tags: ['Generative AI', 'Machine Learning', 'Content'],
  },
  {
    id: '2',
    slug: 'getting-started-with-nextjs-14',
    title: 'Getting Started with Next.js 14 for Modern Web Apps',
    excerpt: 'A comprehensive guide to building high-performance web applications with the latest features in Next.js 14.',
    content: `Next.js continues to be a dominant force in the React ecosystem. With the release of version 14, it introduces even more powerful features for building fast, scalable, and user-friendly web applications. This guide will walk you through setting up a new Next.js 14 project, understanding the App Router, and leveraging Server Components for optimal performance.

From data fetching strategies to deployment options, we provide practical examples and best practices to get you up and running in no time. Whether you're a seasoned developer or just starting, this tutorial has something for you.`,
    imageUrl: getPlaceholderImage('laptop technology'),
    imageHint: 'laptop technology',
    author: {
      name: 'Dev Guru',
      avatarUrl: 'https://picsum.photos/seed/avatar2/40/40',
    },
    date: '2024-05-12',
    category: 'Web Development',
    tags: ['Next.js', 'React', 'JavaScript'],
  },
  {
    id: '3',
    slug: 'designing-intuitive-user-interfaces',
    title: 'Principles of Designing Intuitive User Interfaces',
    excerpt: 'Learn the core principles of UI/UX design that lead to products users love. Good design is invisible.',
    content: `What makes a user interface intuitive? It's a combination of psychology, art, and science. This article breaks down the fundamental principles of user-centric design, including clarity, consistency, feedback, and affordance.

We'll analyze real-world examples of great (and not-so-great) UI design to illustrate these concepts. By the end of this read, you'll have a solid framework for creating interfaces that are not only beautiful but also highly functional and easy to navigate. The user should never have to think about how to use your product.`,
    imageUrl: getPlaceholderImage('futuristic interface'),
    imageHint: 'futuristic interface',
    author: {
      name: 'UX Specialist',
      avatarUrl: 'https://picsum.photos/seed/avatar3/40/40',
    },
    date: '2024-05-10',
    category: 'Design',
    tags: ['UI', 'UX', 'Design Principles'],
  },
  {
    id: '4',
    slug: 'the-ethics-of-artificial-intelligence',
    title: 'Navigating the Ethical Landscape of Artificial Intelligence',
    excerpt: 'As AI becomes more powerful, the ethical questions surrounding it become more urgent. Let\'s discuss.',
    content: `With great power comes great responsibility. Artificial intelligence holds the promise of solving some of humanity's biggest challenges, but it also poses significant ethical risks. This article explores the complex ethical landscape of AI, covering topics like algorithmic bias, job displacement, privacy concerns, and the potential for autonomous weapons.

We aim to foster a nuanced conversation about how to develop and deploy AI responsibly, ensuring that its benefits are shared by all while mitigating its potential harms. The future of AI is not just a technical challenge; it's a moral one.`,
    imageUrl: getPlaceholderImage('robot thinking'),
    imageHint: 'robot thinking',
    author: {
      name: 'AI Ethicist',
      avatarUrl: 'https://picsum.photos/seed/avatar4/40/40',
    },
    date: '2024-05-08',
    category: 'AI',
    tags: ['Ethics', 'AI', 'Society'],
  },
  {
    id: '5',
    slug: 'quantum-computing-explained',
    title: 'Quantum Computing: A Beginner\'s Explanation',
    excerpt: 'Unravel the mysteries of quantum computing, from qubits to superposition and entanglement, in simple terms.',
    content: `Quantum computing sounds like science fiction, but it's a rapidly advancing field with the potential to revolutionize computing as we know it. Forget bits and bytes; it's time to learn about qubits, superposition, and quantum entanglement.

This article provides a simplified, accessible explanation of the core concepts of quantum computing. We'll explore how these futuristic machines work and what kinds of problems they might one day solve, from drug discovery to financial modeling.`,
    imageUrl: getPlaceholderImage('glowing brain'),
    imageHint: 'glowing brain',
    author: {
      name: 'Dr. Quantum',
      avatarUrl: 'https://picsum.photos/seed/avatar5/40/40',
    },
    date: '2024-05-05',
    category: 'Technology',
    tags: ['Quantum Computing', 'Physics', 'Future Tech'],
  },
  {
    id: '6',
    slug: 'mastering-tailwind-css',
    title: 'Mastering Tailwind CSS for Rapid UI Development',
    excerpt: 'A deep dive into the utility-first CSS framework that has taken the web development world by storm.',
    content: `Tired of writing custom CSS for every component? Tailwind CSS offers a different approach. This utility-first framework provides low-level building blocks that let you build completely custom designs without ever leaving your HTML.

In this comprehensive guide, we'll cover everything from setup and configuration to advanced techniques like custom variants and plugins. Learn how to build responsive, modern, and maintainable user interfaces faster than ever before.`,
    imageUrl: getPlaceholderImage('code screen'),
    imageHint: 'code screen',
    author: {
      name: 'Dev Guru',
      avatarUrl: 'https://picsum.photos/seed/avatar2/40/40',
    },
    date: '2024-05-01',
    category: 'Web Development',
    tags: ['Tailwind CSS', 'CSS', 'Frontend'],
  },
];
