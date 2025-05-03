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
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
       // Add Firebase Storage pattern if you plan to serve images directly
       // {
       //   protocol: 'https',
       //   hostname: 'firebasestorage.googleapis.com',
       //   port: '',
       //   pathname: '/v0/b/matrixclub-bb0db.appspot.com/**', // Adjust path for your bucket
       // },
    ],
  },
   env: {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    GOOGLE_GENAI_API_KEY: process.env.GOOGLE_GENAI_API_KEY, // Ensure GenAI key is also passed
  },
  experimental: {
      serverActions: {
        allowedOrigins: ["matrixclub-bb0db.firebaseapp.com", "localhost:9002"] // Add your production domain later
      }
    }
};

export default nextConfig;
