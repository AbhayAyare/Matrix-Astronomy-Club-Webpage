
import type {Metadata} from 'next';
import {Geist} from 'next/font/google';
import './globals.css';
import {Toaster} from '@/components/ui/toaster';
import {FirebaseProvider} from '@/context/firebase-provider';
import {QueryClientProviderWrapper} from '@/context/query-client-provider'; // Updated import path
import { StarBackground } from '@/components/layout/star-background'; // Import the new component
// Removed AuthProvider import

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});


export const metadata: Metadata = {
  title: 'Matrix Astronomy Club', // Updated Title
  description: 'Explore the cosmos with Matrix Astronomy Club.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} antialiased relative`}> {/* Added relative positioning for potential absolute children */}
         <StarBackground /> {/* Add the star background here */}
        <FirebaseProvider>
           {/* AuthProvider removed from here, moved to admin layout */}
             <QueryClientProviderWrapper>
                <div className="relative z-10"> {/* Ensure content is above the background */}
                  {children}
                </div>
               <Toaster />
             </QueryClientProviderWrapper>
           {/* AuthProvider removed from here */}
        </FirebaseProvider>
      </body>
    </html>
  );
}
