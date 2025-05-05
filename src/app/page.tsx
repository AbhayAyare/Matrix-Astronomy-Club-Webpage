
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Globe, UserPlus, Mail, Phone, MapPin, WifiOff, ServerCrash, CalendarDays, Image as ImageIconIcon } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { getSiteContent, SiteContent, defaultSiteContent } from '@/services/content'; // Import defaultSiteContent
import { JoinForm } from '@/components/home/join-form';
import { NewsletterForm } from '@/components/home/newsletter-form';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { UpcomingEventsSection } from '@/components/home/upcoming-events-section';
import { GallerySection } from '@/components/home/gallery-section';
import { FirestoreError } from 'firebase/firestore';


// Helper function to check for offline errors remains useful for site content fetch
function isOfflineError(error: any): boolean {
  const message = String(error?.message ?? '').toLowerCase();
  if (error instanceof FirestoreError) {
    return error.code === 'unavailable' ||
           message.includes('offline') || // Check message content
           message.includes('failed to get document because the client is offline') ||
           message.includes('could not reach cloud firestore backend');
  }
  // Also check for generic network errors if possible, though FirestoreError is primary
  return error instanceof Error && (
      message.includes('network error') ||
      message.includes('client is offline') ||
      message.includes('could not reach cloud firestore backend')
  );
}

export default async function Home() {
  // Fetch only site content in the Server Component
  console.log("[Home Page] Starting site content fetch...");
  const siteContentResult = await getSiteContent();
  // Fetching for events & gallery moved to their respective client components
  console.log("[Home Page] Site content fetch completed.");

  const siteContent = siteContentResult.content;
  const siteContentError = siteContentResult.error; // Get potential error string

  // Determine error state based ONLY on siteContent fetch
  const isContentOffline = siteContentError ? isOfflineError(siteContentError) : false; // Use helper on the string error
  const hasContentOtherErrors = siteContentError ? !isContentOffline : false;

  console.log(`[Home Page] Site Content Fetch - Offline: ${isContentOffline}, Other Errors: ${hasContentOtherErrors}`);


  return (
    <div className="flex flex-col min-h-screen">
      <Header />

       {/* Global Alert - Now ONLY reflects site content fetch status */}
       {siteContentError && (
         <div className="container mx-auto px-4 pt-4">
           <Alert
             variant={isContentOffline ? "default" : "destructive"} // Yellowish for offline, red otherwise
             className={`${isContentOffline ? "border-yellow-500 text-yellow-700 dark:border-yellow-600 dark:text-yellow-300 [&>svg]:text-yellow-500 dark:[&>svg]:text-yellow-400" : "" } animate-fade-in`}
           >
             {isContentOffline ? <WifiOff className="h-4 w-4"/> : <ServerCrash className="h-4 w-4"/>}
             <AlertTitle>
                {isContentOffline ? "Network Connectivity Issue" : "Site Content Error"}
             </AlertTitle>
             <AlertDescription>
               {isContentOffline
                 ? "Could not connect to fetch essential site text due to network issues. Displaying default or potentially outdated text."
                 : "Could not load essential site text (e.g., titles, descriptions) due to server-side errors. Displaying default text."
               }
               {/* Display specific error concisely */}
               <p className="mt-2 text-xs font-mono bg-muted/50 p-1 rounded">Error: {siteContentError}</p>
               Events and Gallery sections will attempt to load separately. Refreshing the page might help.
             </AlertDescription>
           </Alert>
         </div>
       )}

      <main className="flex-grow container mx-auto px-4 py-8 md:py-12 space-y-16 md:space-y-24 overflow-x-hidden">
        {/* Hero Section - Added frame styling, removed border */}
        <section
           id="hero"
           className="text-center py-16 md:py-24 bg-card/80 rounded-2xl shadow-xl animate-fade-in p-8 relative overflow-hidden backdrop-blur-sm"
           style={{ animationDelay: '0s' }} // Start animation immediately
         >
            {/* Optional: Inner shadow for depth */}
            <div className="absolute inset-0 rounded-2xl shadow-inner pointer-events-none"></div>

            <h1 className="text-4xl md:text-6xl font-bold mb-4 text-white animate-fade-in" style={{ animationDelay: '0.1s' }}>{siteContent.heroTitle}</h1>
            <p className="text-lg md:text-xl text-foreground/80 max-w-3xl mx-auto mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>{siteContent.heroSubtitle}</p>
            {/* Enhanced Button Styling */}
            <Button
              size="lg"
              asChild
              className="transform hover:scale-105 transition-all duration-300 ease-in-out animate-fade-in border-2 border-primary/50 hover:border-primary shadow-lg hover:shadow-xl focus:ring-2 focus:ring-offset-2 focus:ring-accent"
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
              {/* Display specific error ONLY if it's a non-offline site content error */}
              {hasContentOtherErrors && (
                <Alert variant="destructive" className="mb-4">
                   <ServerCrash className="h-4 w-4"/>
                  <AlertTitle>Content Loading Issue</AlertTitle>
                  <AlertDescription>Could not load the 'About' content. Displaying default text. Error: {siteContentError}</AlertDescription>
                </Alert>
              )}
              {/* Always display the 'about' content (either fetched or default) */}
              <p className="text-lg leading-relaxed text-black">{siteContent.about}</p>
            </CardContent>
          </Card>
        </section>

        <Separator />

        {/* Upcoming Events Section - Renders Client Component which handles its own fetch/error/loading */}
        <section id="events" className="scroll-mt-20 animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <h2 className="text-3xl md:text-4xl font-semibold mb-8 text-white flex items-center justify-center gap-2">
                 <CalendarDays className="w-8 h-8 text-accent"/>Upcoming Events
            </h2>
            <UpcomingEventsSection />
        </section>


        <Separator />

        {/* Event Gallery Section - Renders Client Component which handles its own fetch/error/loading */}
        <section id="gallery" className="scroll-mt-20 animate-fade-in" style={{ animationDelay: '0.9s' }}>
           <h2 className="text-3xl md:text-4xl font-semibold mb-8 text-white flex items-center justify-center gap-2">
                <ImageIconIcon className="w-8 h-8 text-accent"/>Event Gallery
           </h2>
          <GallerySection />
        </section>

        <Separator />

        {/* Join Matrix Section */}
        <section id="join" className="scroll-mt-20 animate-fade-in" style={{ animationDelay: '1.2s' }}>
          <h2 className="text-3xl md:text-4xl font-semibold mb-8 text-white flex items-center justify-center gap-2"><UserPlus className="w-8 h-8 text-accent"/>{siteContent.joinTitle}</h2>
          <Card className="max-w-2xl mx-auto shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="text-foreground">{siteContent.joinTitle}</CardTitle>
              <CardDescription>{siteContent.joinDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <JoinForm /> {/* Client Component for form handling */}
            </CardContent>
          </Card>
        </section>

        <Separator />

        {/* Newsletter Subscription Section */}
        <section id="newsletter" className="scroll-mt-20 animate-fade-in" style={{ animationDelay: '1.3s' }}>
          <h2 className="text-3xl md:text-4xl font-semibold mb-8 text-white flex items-center justify-center gap-2"><Mail className="w-8 h-8 text-accent"/>{siteContent.newsletterTitle}</h2>
          <Card className="max-w-2xl mx-auto shadow-lg bg-secondary/50 hover:shadow-xl transition-shadow duration-300">
             <CardHeader>
               <CardTitle className="text-foreground">{siteContent.newsletterTitle}</CardTitle>
               <CardDescription className="text-white">{siteContent.newsletterDescription}</CardDescription>
             </CardHeader>
             <CardContent>
              <NewsletterForm /> {/* Client Component for form handling */}
             </CardContent>
          </Card>
        </section>

        <Separator />

        {/* Contact Us Section */}
        <section id="contact" className="scroll-mt-20 animate-fade-in" style={{ animationDelay: '1.4s' }}>
          <h2 className="text-3xl md:text-4xl font-semibold mb-8 text-white flex items-center justify-center gap-2"><Phone className="w-8 h-8 text-accent"/>Contact Us</h2>
           <Card className="max-w-2xl mx-auto shadow-lg hover:shadow-xl transition-shadow duration-300">
             <CardContent className="p-6 md:p-8 space-y-4">
               {/* Display specific error ONLY if it's a non-offline site content error */}
              {hasContentOtherErrors && (
                <Alert variant="destructive" className="mb-4">
                   <ServerCrash className="h-4 w-4"/>
                  <AlertTitle>Contact Details Error</AlertTitle>
                  <AlertDescription>Could not load contact details. Displaying defaults. Error: {siteContentError}</AlertDescription>
                </Alert>
              )}
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
