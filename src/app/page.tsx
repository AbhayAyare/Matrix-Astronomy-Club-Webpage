
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
  console.log("[Home Page] Starting data fetch...");
  const siteContentResult = await getSiteContent();
  // Separate fetch for events - moved inside useEffect in UpcomingEventsSection
  // Separate fetch for gallery - moved inside useEffect in GallerySection
  console.log("[Home Page] Site content fetch completed.");

  const siteContent = siteContentResult.content;
  const siteContentError = siteContentResult.error; // Get potential error string

  // Determine error state based ONLY on siteContent fetch
  const isOffline = siteContentError ? isOfflineError(siteContentError) : false; // Use helper on the string error
  const hasOtherErrors = siteContentError ? !isOffline : false;

  console.log(`[Home Page] Site Content Fetch - Offline: ${isOffline}, Other Errors: ${hasOtherErrors}`);


  return (
    <div className="flex flex-col min-h-screen">
      <Header />

       {/* Global Error/Offline Alert - Now only reflects site content fetch status */}
       {siteContentError && (
         <div className="container mx-auto px-4 pt-4">
           <Alert
             variant={isOffline ? "default" : "destructive"} // Yellowish for offline, red otherwise
             className={`${isOffline ? "border-yellow-500 text-yellow-700 dark:border-yellow-600 dark:text-yellow-300 [&>svg]:text-yellow-500 dark:[&>svg]:text-yellow-400" : "" } animate-fade-in`}
           >
             {isOffline ? <WifiOff className="h-4 w-4"/> : <ServerCrash className="h-4 w-4"/>}
             <AlertTitle>
                {isOffline ? "Network Connectivity Issue" : "Data Loading Issue"}
             </AlertTitle>
             <AlertDescription>
               {isOffline
                 ? "Could not connect to the database due to network issues. Some content (like text) might be outdated or showing defaults."
                 : "Could not load essential site content (like text) due to server-side errors (e.g., permissions, missing data). Displaying default content."
               }
               {/* Display specific error concisely */}
               <p className="mt-2 text-xs">Error: {siteContentError}</p>
               Please try refreshing the page. If the problem persists, contact support.
             </AlertDescription>
           </Alert>
         </div>
       )}

      <main className="flex-grow container mx-auto px-4 py-8 md:py-12 space-y-16 md:space-y-24 overflow-x-hidden">
        {/* Hero Section - Added frame styling */}
        <section
           id="hero"
           className="text-center py-16 md:py-24 border border-primary/20 bg-secondary/10 rounded-2xl shadow-xl animate-fade-in p-8 relative overflow-hidden"
           style={{ animationDelay: '0s' }} // Start animation immediately
         >
            {/* Optional: Inner shadow for depth */}
            <div className="absolute inset-0 rounded-2xl shadow-inner pointer-events-none"></div>

            {/* Changed text color to white */}
            <h1 className="text-4xl md:text-6xl font-bold mb-4 text-foreground animate-fade-in" style={{ animationDelay: '0.1s' }}>{siteContent.heroTitle}</h1>
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
           {/* Changed heading text color to white */}
          <h2 className="text-3xl md:text-4xl font-semibold mb-6 text-foreground flex items-center justify-center gap-2"><Globe className="w-8 h-8 text-accent"/>About Matrix</h2>
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardContent className="p-6 md:p-8">
              {/* Display content error specifically if it occurred */}
              {siteContentError && !isOffline && (
                <Alert variant="destructive" className="mb-4">
                   <ServerCrash className="h-4 w-4"/> {/* Use ServerCrash for error */}
                  <AlertTitle>Content Error</AlertTitle>
                  <AlertDescription>Could not load the 'About' content. Displaying default text. Error: {siteContentError}</AlertDescription>
                </Alert>
              )}
              {/* Always display the 'about' content (either fetched or default) */}
              <p className="text-lg leading-relaxed text-foreground/90">{siteContent.about}</p>
            </CardContent>
          </Card>
        </section>

        <Separator />

        {/* Upcoming Events Section - Render Client Component */}
        <section id="events" className="scroll-mt-20 animate-fade-in" style={{ animationDelay: '0.5s' }}>
           {/* Changed heading text color to white */}
          <h2 className="text-3xl md:text-4xl font-semibold mb-8 text-foreground flex items-center justify-center gap-2">
            <CalendarDays className="w-8 h-8 text-accent"/>Upcoming Events
          </h2>
          <UpcomingEventsSection /> {/* Pass siteContent if needed for fallbacks inside */}
        </section>

        <Separator />

        {/* Event Gallery Section - Render Client Component */}
        <section id="gallery" className="scroll-mt-20 animate-fade-in" style={{ animationDelay: '0.9s' }}>
          {/* Removed the h2 heading for Event Gallery */}
          <GallerySection /> {/* Pass siteContent if needed for fallbacks inside */}
        </section>

        <Separator />

        {/* Join Matrix Section */}
        <section id="join" className="scroll-mt-20 animate-fade-in" style={{ animationDelay: '1.2s' }}>
           {/* Changed heading text color to white */}
          <h2 className="text-3xl md:text-4xl font-semibold mb-8 text-foreground flex items-center justify-center gap-2"><UserPlus className="w-8 h-8 text-accent"/>{siteContent.joinTitle}</h2>
          <Card className="max-w-2xl mx-auto shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              {/* Changed title text color to white */}
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
           {/* Changed heading text color to white */}
          <h2 className="text-3xl md:text-4xl font-semibold mb-8 text-foreground flex items-center justify-center gap-2"><Mail className="w-8 h-8 text-accent"/>{siteContent.newsletterTitle}</h2>
          <Card className="max-w-2xl mx-auto shadow-lg bg-secondary/50 hover:shadow-xl transition-shadow duration-300">
             <CardHeader>
                {/* Changed title text color to white */}
               <CardTitle className="text-foreground">{siteContent.newsletterTitle}</CardTitle>
               <CardDescription>{siteContent.newsletterDescription}</CardDescription>
             </CardHeader>
             <CardContent>
              <NewsletterForm /> {/* Client Component for form handling */}
             </CardContent>
          </Card>
        </section>

        <Separator />

        {/* Contact Us Section */}
        <section id="contact" className="scroll-mt-20 animate-fade-in" style={{ animationDelay: '1.4s' }}>
           {/* Changed heading text color to white */}
          <h2 className="text-3xl md:text-4xl font-semibold mb-8 text-foreground flex items-center justify-center gap-2"><Phone className="w-8 h-8 text-accent"/>Contact Us</h2>
           <Card className="max-w-2xl mx-auto shadow-lg hover:shadow-xl transition-shadow duration-300">
             <CardContent className="p-6 md:p-8 space-y-4">
               {/* Display content error specifically if it occurred */}
              {siteContentError && !isOffline && (
                <Alert variant="destructive" className="mb-4">
                   <ServerCrash className="h-4 w-4"/> {/* Use ServerCrash for error */}
                  <AlertTitle>Contact Details Error</AlertTitle>
                  <AlertDescription>Could not load contact details. Displaying defaults. Error: {siteContentError}</AlertDescription>
                </Alert>
              )}
               <div className="flex items-center gap-3 group">
                 <Mail className="w-5 h-5 text-accent group-hover:animate-pulse"/>
                 {/* Changed text color to black (light mode) / white (dark mode) */}
                 <a href={`mailto:${siteContent.contactEmail}`} className="text-black dark:text-white hover:text-accent transition-colors duration-200 break-all">{siteContent.contactEmail || 'N/A'}</a>
               </div>
               <div className="flex items-center gap-3 group">
                 <Phone className="w-5 h-5 text-accent group-hover:animate-pulse"/>
                 {/* Changed text color to black (light mode) / white (dark mode) */}
                 <a href={`tel:${siteContent.contactPhone}`} className="text-black dark:text-white hover:text-accent transition-colors duration-200">{siteContent.contactPhone || 'N/A'}</a>
               </div>
               <div className="flex items-start gap-3 group">
                 <MapPin className="w-5 h-5 text-accent mt-1 group-hover:animate-pulse"/>
                  {/* Changed text color to black (light mode) / white (dark mode) */}
                 <span className="text-black dark:text-white whitespace-pre-wrap">{siteContent.contactAddress || 'Location not specified'}</span>
               </div>
             </CardContent>
           </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
}
