import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, BarChart, Bot, PenSquare } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const features = [
    {
      icon: <PenSquare className="h-8 w-8 text-primary" />,
      title: 'AI-Powered Ad Creation',
      description: 'Generate compelling ad copy and visuals in seconds. Let our AI craft campaigns that convert.',
    },
    {
      icon: <Bot className="h-8 w-8 text-primary" />,
      title: 'Autonomous Site Marketing',
      description: 'Our AI agent analyzes the market and writes SEO-optimized articles to boost your site\'s ranking.',
    },
    {
      icon: <BarChart className="h-8 w-8 text-primary" />,
      title: 'Financial Analytics',
      description: 'Track your spending, manage your budget, and withdraw your referral earnings with ease.',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="mb-20 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-primary sm:text-5xl md:text-6xl font-headline">
          Hagaaty: AI-Powered Advertising & Marketing
        </h1>
        <p className="mt-6 max-w-3xl mx-auto text-lg text-muted-foreground sm:text-xl">
          Launch, manage, and optimize your ad campaigns with a nearly autonomous AI. From ad creation to SEO, we handle it all.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/signup">Get Started</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section>
        <h2 className="text-3xl font-bold text-center tracking-tight mb-12 font-headline">
          Everything You Need to Succeed
        </h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card key={index} className="flex flex-col text-center items-center">
              <CardHeader>
                <div className="bg-primary/10 p-4 rounded-full mb-4">
                  {feature.icon}
                </div>
                <CardTitle className="font-headline">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
