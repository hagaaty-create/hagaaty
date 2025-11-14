import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  serverExternalPackages: ['firebase-admin'],
  devIndicators: {
    allowedDevOrigins: [
      '*.cluster-fbfjltn375c6wqxlhoehbz44sk.cloudworkstations.dev',
    ],
  },
  // Hardcode environment variables here to ensure they are available
  env: {
    NEXT_PUBLIC_FIREBASE_API_KEY: 'YOUR_API_KEY',
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'YOUR_AUTH_DOMAIN',
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'YOUR_PROJECT_ID',
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'YOUR_STORAGE_BUCKET',
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: 'YOUR_MESSAGING_SENDER_ID',
    NEXT_PUBLIC_FIREBASE_APP_ID: 'YOUR_APP_ID',
  }
};

export default nextConfig;
