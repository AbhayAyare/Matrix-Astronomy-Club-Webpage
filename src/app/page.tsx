
'use client';

import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Globe, UserPlus, Mail, Phone, MapPin, Newspaper } from 'lucide-react'; // Removed WifiOff, ServerCrash, Loader2, AlertCircle as they are handled by loader
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import type { SiteContent } from '@/services/content'; // Type only
// Removed defaultSiteContent import as it's provided by the loader
import { JoinForm } from '@/components/home/join-form';
import { NewsletterForm } from '@/components/home/newsletter-form';
// Removed Alert components as global alert is in SiteContentLoader
import { UpcomingEventsSection } from '@/components/home/upcoming-events-section';
import { GallerySection } from '@/components/home/gallery-section';
// Removed isOfflineError import as it's used in SiteContentLoader
import { SiteContentLoader } from '@/components/site-content-loader'; // Import SiteContentLoader


export default function Home() {

  return (
    <SiteContentLoader>
      {({ content: siteContent, error: siteContentError, loading: siteContentLoading, isOffline: isContentOffline }) => {

         // SiteContentLoader now handles the loading state and the global error alert.
         // We just need to render the page content using the provided siteContent.

        return (
          <div className="flex flex-col min-h-screen">
            <Header />

            {/* Global error alert is rendered inside SiteContentLoader, so no need here */}

            <main className="flex-grow container mx-auto px-4 py-8 md:py-12 space-y-16 md:space-y-24 overflow-x-hidden">
               {/* Hero Section */}
               <section
                 id="hero"
                 className="text-center py-16 md:py-24 bg-primary/80 rounded-2xl shadow-xl animate-fade-in p-8 relative overflow-hidden backdrop-blur-sm border-transparent"
                 style={{ animationDelay: '0s' }}
               >
                  <div className="absolute inset-0 rounded-2xl shadow-inner pointer-events-none"></div>
                  <h1 className="text-4xl md:text-6xl font-bold mb-4 text-white animate-fade-in" style={{ animationDelay: '0.1s' }}>{siteContent.heroTitle}</h1>
                  <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>{siteContent.heroSubtitle}</p>
                  <Button
                    size="lg"
                    asChild
                    variant="secondary"
                    className="transform hover:scale-105 transition-all duration-300 ease-in-out animate-fade-in border-2 border-transparent hover:border-accent shadow-lg hover:shadow-xl focus:ring-2 focus:ring-offset-2 focus:ring-accent"
                    style={{ animationDelay: '0.3s' }}
                  >
                    <Link href="#join">Join the Club</Link>
                  </Button>
              </section>


              {/* About Matrix Section */}
              <section id="about" className="scroll-mt-20 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                 <h2 className="text-3xl md:text-4xl font-semibold mb-6 text-white flex items-center justify-center gap-2"><Globe className="w-8 h-8 text-accent"/>About Matrix</h2>
                 <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardContent className="p-6 md:p-8">
                     {/* Removed specific error alert for About section */}
                     <p className="text-lg leading-relaxed text-black">{siteContent.about}</p>
                   </CardContent>
                 </Card>
              </section>

              <Separator />

              {/* Upcoming Events Section */}
               <section id="events" className="scroll-mt-20 animate-fade-in" style={{ animationDelay: '0.5s' }}>
                  <UpcomingEventsSection /> {/* This component handles its own loading/error state */}
               </section>

              <Separator />

              {/* Event Gallery Section */}
              <section id="gallery" className="scroll-mt-20 animate-fade-in" style={{ animationDelay: '0.9s' }}>
                <GallerySection /> {/* This component handles its own loading/error state */}
              </section>


              <Separator />

              {/* Join Matrix Section */}
              <section id="join" className="scroll-mt-20 animate-fade-in" style={{ animationDelay: '1.2s' }}>
                 <h2 className="text-3xl md:text-4xl font-semibold mb-8 text-white flex items-center justify-center gap-2"><UserPlus className="w-8 h-8 text-accent"/>{siteContent.joinTitle}</h2>
                 <Card className="max-w-2xl mx-auto shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardHeader>
                    <CardTitle>{siteContent.joinTitle}</CardTitle>
                    <CardDescription>{siteContent.joinDescription}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <JoinForm />
                  </CardContent>
                </Card>
              </section>

              <Separator />

              {/* Newsletter Subscription Section */}
               <section id="newsletter" className="scroll-mt-20 animate-fade-in" style={{ animationDelay: '1.3s' }}>
                 <h2 className="text-3xl md:text-4xl font-semibold mb-8 text-white flex items-center justify-center gap-2"><Newspaper className="w-8 h-8 text-accent"/>{siteContent.newsletterTitle}</h2>
                 <Card className="max-w-2xl mx-auto shadow-lg bg-card hover:shadow-xl transition-shadow duration-300">
                    <CardHeader>
                      <CardTitle>{siteContent.newsletterTitle}</CardTitle>
                      <CardDescription className="text-white">{siteContent.newsletterDescription}</CardDescription>
                    </CardHeader>
                    <CardContent>
                     <NewsletterForm />
                    </CardContent>
                 </Card>
               </section>

              <Separator />

              {/* Contact Us Section */}
              <section id="contact" className="scroll-mt-20 animate-fade-in" style={{ animationDelay: '1.4s' }}>
                 <h2 className="text-3xl md:text-4xl font-semibold mb-8 text-white flex items-center justify-center gap-2"><Phone className="w-8 h-8 text-accent"/>Contact Us</h2>
                  <Card className="max-w-2xl mx-auto shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardContent className="p-6 md:p-8 space-y-4">
                      {/* Removed specific error alert for Contact section */}
                      <div className="flex items-center gap-3 group">
                        <Mail className="w-5 h-5 text-accent group-hover:animate-pulse"/>
                        <a href={`mailto:${siteContent.contactEmail}`} className="text-black hover:text-accent transition-colors duration-200 break-all">{siteContent.contactEmail || 'N/A'}</a>
                      </div>
                      <div className="flex items-center gap-3 group">
                        <Phone className="w-5 h-5 text-accent group-hover:animate-pulse"/>
                        <a href={`tel:${siteContent.contactPhone}`} className="text-black hover:text-accent transition-colors duration-200">{siteContent.contactPhone || 'N/A'}</a>
                      </div>
                      <div className="flex items-start gap-3 group">
                        <MapPin className="w-5 h-5 text-accent mt-1 group-hover:animate-pulse"/>
                        <span className="text-black whitespace-pre-wrap">{siteContent.contactAddress || 'Location not specified'}, India</span>
                      </div>
                    </CardContent>
                  </Card>
               </section>
            </main>
            <Footer />
          </div>
        );
      }}
    </SiteContentLoader>
  );
}
