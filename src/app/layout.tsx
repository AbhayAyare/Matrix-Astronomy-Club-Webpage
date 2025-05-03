import type {Metadata} from 'next';
import {Geist} from 'next/font/google';
import './globals.css';
import {Toaster} from '@/components/ui/toaster';
import {FirebaseProvider} from '@/context/firebase-provider';
import {QueryClientProviderWrapper} from '@/context/query-client-provider'; // Updated import path
import { StarBackground } from '@/components/layout/star-background'; // Import the new component
import { AuthProvider } from '@/context/auth-provider'; // Import AuthProvider

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});


export const metadata: Metadata = {
  title: 'Matrix Astronomy Hub',
  description: 'Explore the cosmos with Matrix Astronomy Club.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} antialiased`}>
         <StarBackground /> {/* Add the star background here */}
        <FirebaseProvider>
           <AuthProvider> {/* Wrap with AuthProvider */}
             <QueryClientProviderWrapper>
               {children}
               <Toaster />
             </QueryClientProviderWrapper>
           </AuthProvider>
        </FirebaseProvider>
      </body>
    </html>
  );
}
