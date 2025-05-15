
import type {Metadata} from 'next';
import {Geist} from 'next/font/google';
import './globals.css';
import {Toaster} from '@/components/ui/toaster';
import {FirebaseProvider} from '@/context/firebase-provider';
import {QueryClientProviderWrapper} from '@/context/query-client-provider';
import { StarBackground } from '@/components/layout/star-background';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});


export const metadata: Metadata = {
  title: 'Matrix Astronomy Club',
  description: 'Explore the cosmos with Matrix Astronomy Club.',
  icons: { // More explicit "no icons" configuration
    icon: [],
    shortcut: [],
    apple: [],
    other: [],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} antialiased relative`}>
         <StarBackground />
        <FirebaseProvider>
             <QueryClientProviderWrapper>
                <div className="relative z-10">
                  {children}
                </div>
               <Toaster />
             </QueryClientProviderWrapper>
        </FirebaseProvider>
      </body>
    </html>
  );
}
