
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export', // Ensures static site generation compatible with Firebase Hosting
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
    unoptimized: true, // Required for static export with next/image
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
  // Server Actions configuration is typically for dynamic environments,
  // might not be strictly necessary for a fully static export but doesn't hurt to keep
  // if parts of the build process might use them internally or if you switch modes later.
  experimental: {
      serverActions: {
        allowedOrigins: [
            "matrixclub-bb0db.firebaseapp.com",
            "matrixclub-bb0db.web.app", // Add the .web.app domain
            "localhost:9002", // Local development
            "127.0.0.1:9002" // Local development
        ]
      }
    }
};

export default nextConfig;
