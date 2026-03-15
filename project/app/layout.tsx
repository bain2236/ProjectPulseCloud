import './globals.css';
import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import PostHogProvider from '@/components/PostHogProvider';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter' 
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono'
});

const ogImageUrl = process.env.NEXT_PUBLIC_URL
  ? `${process.env.NEXT_PUBLIC_URL}/face.jpeg`
  : '/face.jpeg';

export const metadata: Metadata = {
  title: 'Alex Bainbridge | Technical Lead & Cloud Native Architect',
  description:
    'A beautiful, interactive professional profile with a data-driven Voronoi word cloud visualization.',
  openGraph: {
    title: 'Alex Bainbridge | Technical Lead & Cloud Native Architect',
    description:
      'A beautiful, interactive professional profile with a data-driven Voronoi word cloud visualization.',
    type: 'website',
    url: process.env.NEXT_PUBLIC_URL || 'https://github.com/bain2236/PulseCloud',
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: 'Alex Bainbridge',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Alex Bainbridge | Technical Lead & Cloud Native Architect',
    description:
      'A beautiful, interactive professional profile with a data-driven Voronoi word cloud visualization.',
    images: [ogImageUrl],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased">
        <PostHogProvider>
          {children}
        </PostHogProvider>
      </body>
    </html>
  );
}