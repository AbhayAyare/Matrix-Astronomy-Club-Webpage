
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Globe, UserPlus, Mail, Phone, MapPin, Newspaper, ServerCrash, WifiOff, AlertCircle, CalendarDays, Image as ImageIcon } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { SiteContent, defaultSiteContent } from '@/services/content';
import { JoinForm } from '@/components/home/join-form';
import { NewsletterForm } from '@/components/home/newsletter-form';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { UpcomingEventsSection } from '@/components/home/upcoming-events-section';
import { GallerySection } from '@/components/home/gallery-section';
import { fetchSiteContentData, fetchUpcomingEventsData, fetchGalleryImagesData, Event, GalleryImageMetadata } from '@/services/page-data';
import { isOfflineError as checkOfflineError } from '@/lib/utils'; // Renamed for clarity

// Props to receive initial data
interface HomePageClientProps {
  initialSiteContent: SiteContent;
  initialUpcomingEvents: Event[];
  initialGalleryImages: GalleryImageMetadata[];
  initialAllErrors: string[];
}

export function HomePageClient({
  initialSiteContent,
  initialUpcomingEvents,
  initialGalleryImages,
  initialAllErrors,
}: HomePageClientProps) {
  const [siteContent, setSiteContent] = useState<SiteContent>(initialSiteContent);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>(initialUpcomingEvents);
  const [galleryImages, setGalleryImages] = useState<GalleryImageMetadata[]>(initialGalleryImages);
  const [clientErrors, setClientErrors] = useState<string[]>(initialAllErrors);
  const [isLoadingClientData, setIsLoadingClientData] = useState(true); // True initially because we will re-fetch

  useEffect(() => {
    console.log("[HomePageClient] Component mounted. Initial errors:", initialAllErrors);
    async function loadFreshData() {
      console.log("[HomePageClient] useEffect: Starting client-side data fetch...");
      setIsLoadingClientData(true);
      const currentFetchedErrors: string[] = [];

      try {
        const contentResult = await fetchSiteContentData();
        if (contentResult.error) currentFetchedErrors.push(contentResult.error);
        setSiteContent(contentResult.content);
        console.log("[HomePageClient] Client-side site content fetched.");
      } catch (e:any) { currentFetchedErrors.push(`Client Content Fetch Error: ${e.message}`); }

      try {
        const eventsResult = await fetchUpcomingEventsData();
        if (eventsResult.error) currentFetchedErrors.push(eventsResult.error);
        setUpcomingEvents(eventsResult.data);
        console.log("[HomePageClient] Client-side upcoming events fetched:", eventsResult.data.length, "events");
      } catch (e:any) { currentFetchedErrors.push(`Client Events Fetch Error: ${e.message}`); }

      try {
        const galleryResult = await fetchGalleryImagesData();
        if (galleryResult.error) currentFetchedErrors.push(galleryResult.error);
        setGalleryImages(galleryResult.data);
        console.log("[HomePageClient] Client-side gallery images fetched:", galleryResult.data.length, "images");
      } catch (e:any) { currentFetchedErrors.push(`Client Gallery Fetch Error: ${e.message}`); }
      
      setClientErrors(currentFetchedErrors);
      setIsLoadingClientData(false);
      console.log("[HomePageClient] Client-side data fetch complete. Errors:", currentFetchedErrors);
    }

    loadFreshData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  const displayErrors = clientErrors;
  const isAnyOfflineClient = displayErrors.some(err => checkOfflineError(new Error(err))); // Use imported and renamed checker

  // Determine if we should show a "content might be stale" type of message or specific fetch errors.
  // For now, the global error alert will show `clientErrors`.
  // Child components `UpcomingEventsSection` and `GallerySection` will receive potentially updated data.

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      {isLoadingClientData && initialAllErrors.length === 0 && (
        <div className="container mx-auto px-4 pt-4 text-center text-muted-foreground">
          <p>Loading latest content...</p>
        </div>
      )}

      {displayErrors.length > 0 && (
         <div className="container mx-auto px-4 pt-4">
            <Alert
             variant={isAnyOfflineClient ? "default" : "destructive"}
             className={`${isAnyOfflineClient ? "border-yellow-500 text-yellow-700 dark:border-yellow-600 dark:text-yellow-300 [&>svg]:text-yellow-500 dark:[&>svg]:text-yellow-400" : ""} animate-fade-in`}
           >
             {isAnyOfflineClient ? <WifiOff className="h-4 w-4"/> : <ServerCrash className="h-4 w-4"/>}
             <AlertTitle>
               {isAnyOfflineClient ? "Network Connectivity Issue" : "Data Loading Issue"}
             </AlertTitle>
             <AlertDescription>
               {isAnyOfflineClient
                 ? "Could not connect to fetch all site data. Displaying available or default content."
                 : `Could not load all site data due to server-side errors or network issues. Some sections might be showing default content.`}
               <ul className="list-disc list-inside mt-2 text-xs max-h-32 overflow-y-auto">
                 {displayErrors.map((err, index) => (
                   <li key={index}>{err}</li>
                 ))}
               </ul>
               {!isAnyOfflineClient && "Please try refreshing the page. If the problem persists, contact support."}
             </AlertDescription>
           </Alert>
          </div>
       )}

      <main className="flex-grow container mx-auto px-4 py-8 md:py-12 space-y-16 md:space-y-24 overflow-x-hidden">
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

        <section id="about" className="scroll-mt-20 animate-fade-in" style={{ animationDelay: '0.4s' }}>
           <h2 className="text-3xl md:text-4xl font-semibold mb-6 text-white flex items-center justify-center gap-2"><Globe className="w-8 h-8 text-accent"/>About Matrix</h2>
           <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardContent className="p-6 md:p-8">
               <p className="text-lg leading-relaxed text-black">{siteContent.about}</p>
             </CardContent>
           </Card>
        </section>

        <Separator />

         <section id="events" className="scroll-mt-20 animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <h2 className="text-3xl md:text-4xl font-semibold mb-8 text-white flex items-center justify-center gap-2">
             <CalendarDays className="w-8 h-8 text-accent"/>Upcoming Events
            </h2>
            <UpcomingEventsSection events={upcomingEvents} error={clientErrors.find(e => e.toLowerCase().includes('event')) || null} />
         </section>

        <Separator />

         <section id="gallery" className="scroll-mt-20 animate-fade-in" style={{ animationDelay: '0.9s' }}>
             <h2 className="text-3xl md:text-4xl font-semibold mb-8 text-white flex items-center justify-center gap-2">
               <ImageIcon className="w-8 h-8 text-accent"/>Event Gallery
            </h2>
            <GallerySection galleryImages={galleryImages} error={clientErrors.find(e => e.toLowerCase().includes('gallery')) || null} />
         </section>

        <Separator />

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

         <section id="newsletter" className="scroll-mt-20 animate-fade-in" style={{ animationDelay: '1.3s' }}>
           <h2 className="text-3xl md:text-4xl font-semibold mb-8 text-white flex items-center justify-center gap-2"><Newspaper className="w-8 h-8 text-accent"/>{siteContent.newsletterTitle}</h2>
           <Card className="max-w-2xl mx-auto shadow-lg bg-card hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <CardTitle>{siteContent.newsletterTitle}</CardTitle>
                <CardDescription className="text-sm text-black">{siteContent.newsletterDescription}</CardDescription>
              </CardHeader>
              <CardContent>
               <NewsletterForm />
              </CardContent>
           </Card>
         </section>

        <Separator />

        <section id="contact" className="scroll-mt-20 animate-fade-in" style={{ animationDelay: '1.4s' }}>
           <h2 className="text-3xl md:text-4xl font-semibold mb-8 text-white flex items-center justify-center gap-2"><Phone className="w-8 h-8 text-accent"/>Contact Us</h2>
            <Card className="max-w-2xl mx-auto shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-6 md:p-8 space-y-4">
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
}
