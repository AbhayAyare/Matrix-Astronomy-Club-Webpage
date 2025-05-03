
import Link from 'next/link';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Globe, CalendarDays, Image as ImageIcon, UserPlus, Mail, Phone, MapPin } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { getSiteContent, SiteContent } from '@/services/content';
// Firestore imports for events and gallery
import { collection, getDocs, query, orderBy, Timestamp, where, FirestoreError, limit } from 'firebase/firestore';
// Storage imports (still needed for event images if they use storage URLs)
import { ref, listAll, getDownloadURL, StorageError } from 'firebase/storage';
import { db, storage } from '@/config/firebase';
import { JoinForm } from '@/components/home/join-form';
import { NewsletterForm } from '@/components/home/newsletter-form';

// Interface for events fetched from Firestore
interface Event {
  id: string;
  name: string;
  date: Timestamp; // Use Firestore Timestamp
  description: string;
  imageURL?: string; // Optional field for image URL (could be Storage URL or external)
}

// Interface for Gallery Image Metadata fetched from Firestore
interface GalleryImage {
  id: string; // Firestore document ID
  url: string; // Download URL from Storage (stored in Firestore)
  name: string; // Name stored in Firestore
}

// Fetch upcoming events from Firestore
async function getUpcomingEvents(): Promise<Event[]> {
  const eventsCollectionRef = collection(db, 'events');
  const today = Timestamp.now(); // Get current timestamp
  const fallbackDate = new Date();
  fallbackDate.setDate(fallbackDate.getDate() + 7); // 1 week from now

  try {
    // Query for events where the date is greater than or equal to today, limit results
    const q = query(eventsCollectionRef, where("date", ">=", today), orderBy("date", "asc"), limit(6)); // Limit to 6 events
    const querySnapshot = await getDocs(q);

    const events = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date as Timestamp,
      // Use stored imageURL or fallback
      imageURL: doc.data().imageURL || `https://picsum.photos/seed/${doc.id}/400/250`,
    })) as Event[];

    return events;
  } catch (error) {
    console.error("Error fetching upcoming events:", error);
    if (error instanceof FirestoreError && (error.code === 'unavailable' || error.message.includes('offline'))) {
        console.warn("Offline: Cannot fetch upcoming events. Using fallback.");
    } else if (error instanceof Error && error.message.includes('firestore/indexes')) {
        console.error("Firestore index missing for querying/ordering events by date. Please create it.");
    } else {
        console.error("An unexpected error occurred fetching events.");
    }
    // Return fallback data
    return [
      { id: 'fallback1', name: 'Deep Sky Observation Night (Fallback)', date: Timestamp.fromDate(fallbackDate), description: 'Join us for a night under the stars observing distant galaxies and nebulae.', imageURL: 'https://picsum.photos/seed/event1/400/250'},
    ];
  }
}

// Fetch gallery image metadata from Cloud Firestore
async function getGalleryImages(): Promise<GalleryImage[]> {
  const galleryCollectionRef = collection(db, 'gallery');
  try {
    // Query Firestore, order by creation time descending, limit results
    const q = query(galleryCollectionRef, orderBy("createdAt", "desc"), limit(12)); // Limit to 12 images for the homepage
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log("No gallery images found in Firestore.");
      return [];
    }

    const images = querySnapshot.docs.map(doc => ({
      id: doc.id,
      url: doc.data().url as string, // Get URL from Firestore data
      name: doc.data().name as string, // Get name from Firestore data
    })) as GalleryImage[];

    return images;
  } catch (error) {
      console.error("Error fetching gallery images from Firestore:", error);
      if (error instanceof FirestoreError) {
           if (error.code === 'failed-precondition') {
                console.error(`Firestore index required for '${collection(db, 'gallery').id}' ordered by 'createdAt' descending. Please create it.`);
           } else if (error.code === 'unavailable' || error.message.includes('offline')) {
               console.warn("Offline: Cannot fetch gallery images. Using fallback.");
           }
      } else {
           console.error("An unexpected error occurred fetching gallery images.");
      }
    // Return fallback data on error
    return [
      { id: 'g1', url: 'https://picsum.photos/seed/gallery1/300/200', name: 'Nebula (Fallback)'},
      { id: 'g2', url: 'https://picsum.photos/seed/gallery2/300/200', name: 'Galaxy (Fallback)'},
      { id: 'g3', url: 'https://picsum.photos/seed/gallery3/300/200', name: 'Moon surface (Fallback)'},
      { id: 'g4', url: 'https://picsum.photos/seed/gallery4/300/200', name: 'Star cluster (Fallback)'},
      { id: 'g5', url: 'https://picsum.photos/seed/gallery5/300/200', name: 'Planet Jupiter (Fallback)'},
      { id: 'g6', url: 'https://picsum.photos/seed/gallery6/300/200', name: 'Observatory telescope (Fallback)'},
    ];
  }
}


export default async function Home() {
  // Fetch dynamic data in the Server Component
  const siteContent: SiteContent = await getSiteContent();
  const upcomingEvents: Event[] = await getUpcomingEvents();
  const galleryImages: GalleryImage[] = await getGalleryImages(); // Fetches from Firestore now


  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-8 md:py-12 space-y-16 md:space-y-24 overflow-x-hidden">
        {/* Hero Section */}
        <section id="hero" className="text-center py-16 md:py-24 bg-gradient-to-b from-primary/10 to-transparent rounded-lg shadow-inner animate-fade-in">
           <h1 className="text-4xl md:text-6xl font-bold mb-4 text-primary animate-fade-in" style={{ animationDelay: '0.1s' }}>{siteContent.heroTitle}</h1>
           <p className="text-lg md:text-xl text-foreground/80 max-w-3xl mx-auto mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>{siteContent.heroSubtitle}</p>
           <Button size="lg" asChild className="transform hover:scale-105 transition-transform duration-300 ease-in-out animate-fade-in" style={{ animationDelay: '0.3s' }}>
             <Link href="#join">Join the Club</Link>
           </Button>
        </section>

        {/* About Matrix Section */}
        <section id="about" className="scroll-mt-20 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <h2 className="text-3xl md:text-4xl font-semibold mb-6 text-primary flex items-center justify-center gap-2"><Globe className="w-8 h-8 text-accent"/>About Matrix</h2>
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardContent className="p-6 md:p-8">
              <p className="text-lg leading-relaxed text-foreground/90">{siteContent.about}</p>
            </CardContent>
          </Card>
        </section>

        <Separator />

        {/* Upcoming Events Section */}
        <section id="events" className="scroll-mt-20 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <h2 className="text-3xl md:text-4xl font-semibold mb-8 text-primary flex items-center justify-center gap-2"><CalendarDays className="w-8 h-8 text-accent"/>Upcoming Events</h2>
          {upcomingEvents.length === 0 ? (
             <Card>
                 <CardContent className="p-6 text-center text-muted-foreground">
                     No upcoming events scheduled yet. Stay tuned!
                 </CardContent>
             </Card>
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {upcomingEvents.map((event, index) => (
                <Card key={event.id} className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 ease-in-out animate-fade-in" style={{ animationDelay: `${0.6 + index * 0.1}s` }}>
                   <div className="relative h-48 w-full overflow-hidden group">
                     <Image
                       src={event.imageURL || `https://picsum.photos/seed/${event.id}/400/250`}
                       alt={event.name}
                       fill
                       sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                       className="object-cover transition-transform duration-300 group-hover:scale-105"
                       data-ai-hint="astronomy club event"
                       priority={index < 3}
                       onError={(e) => {
                          console.warn(`Failed to load event image: ${event.imageURL}`);
                          e.currentTarget.src = `https://picsum.photos/seed/${event.id}/400/250`; // Fallback placeholder
                       }}
                     />
                   </div>
                  <CardHeader>
                    <CardTitle className="text-xl">{event.name}</CardTitle>
                    <CardDescription>{event.date.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-foreground/80">{event.description}</p>
                  </CardContent>
                   <CardFooter className="flex justify-between items-center mt-auto pt-4">
                     <Badge variant="secondary" className="bg-accent text-accent-foreground">Upcoming</Badge>
                     <Button variant="outline" size="sm" disabled className="transform hover:scale-105 transition-transform duration-200">Learn More</Button>
                   </CardFooter>
                </Card>
              ))}
             </div>
          )}
        </section>

        <Separator />

        {/* Event Gallery Section - Uses Firestore data */}
        <section id="gallery" className="scroll-mt-20 animate-fade-in" style={{ animationDelay: '0.9s' }}>
           <h2 className="text-3xl md:text-4xl font-semibold mb-8 text-primary flex items-center justify-center gap-2"><ImageIcon className="w-8 h-8 text-accent"/>Event Gallery</h2>
            {galleryImages.length === 0 ? (
                 <Card>
                    <CardContent className="p-6 text-center text-muted-foreground">
                        The gallery is currently empty. Check back soon!
                    </CardContent>
                </Card>
             ) : (
                <div className="grid grid-cols-gallery gap-4">
                 {galleryImages.map((image, index) => (
                    <div key={image.id} className="overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 group animate-fade-in" style={{ animationDelay: `${1 + index * 0.05}s` }}>
                      <Image
                        src={image.url} // URL from Firestore metadata
                        alt={image.name || `Gallery image ${image.id}`} // Name from Firestore metadata
                        width={300}
                        height={200}
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 250px"
                        className="object-cover w-full h-full aspect-[3/2] transform group-hover:scale-105 transition-transform duration-300 ease-in-out"
                        data-ai-hint="astronomy club gallery space"
                        loading={index < 6 ? "eager" : "lazy"}
                        onError={(e) => {
                           console.warn(`Failed to load gallery image: ${image.url}`);
                           e.currentTarget.src = `https://picsum.photos/seed/${image.id}/300/200`; // Fallback placeholder
                         }}
                      />
                    </div>
                  ))}
                </div>
             )}
        </section>

        <Separator />

        {/* Join Matrix Section */}
        <section id="join" className="scroll-mt-20 animate-fade-in" style={{ animationDelay: '1.2s' }}>
          <h2 className="text-3xl md:text-4xl font-semibold mb-8 text-primary flex items-center justify-center gap-2"><UserPlus className="w-8 h-8 text-accent"/>{siteContent.joinTitle}</h2>
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
          <h2 className="text-3xl md:text-4xl font-semibold mb-8 text-primary flex items-center justify-center gap-2"><Mail className="w-8 h-8 text-accent"/>{siteContent.newsletterTitle}</h2>
          <Card className="max-w-2xl mx-auto shadow-lg bg-secondary/50 hover:shadow-xl transition-shadow duration-300">
             <CardHeader>
               <CardTitle>{siteContent.newsletterTitle}</CardTitle>
               <CardDescription>{siteContent.newsletterDescription}</CardDescription>
             </CardHeader>
             <CardContent>
              <NewsletterForm />
             </CardContent>
          </Card>
        </section>

        <Separator />

        {/* Contact Us Section */}
        <section id="contact" className="scroll-mt-20 animate-fade-in" style={{ animationDelay: '1.4s' }}>
          <h2 className="text-3xl md:text-4xl font-semibold mb-8 text-primary flex items-center justify-center gap-2"><Phone className="w-8 h-8 text-accent"/>Contact Us</h2>
           <Card className="max-w-2xl mx-auto shadow-lg hover:shadow-xl transition-shadow duration-300">
             <CardContent className="p-6 md:p-8 space-y-4">
               <div className="flex items-center gap-3 group">
                 <Mail className="w-5 h-5 text-accent group-hover:animate-pulse"/>
                 <a href={`mailto:${siteContent.contactEmail}`} className="text-foreground/90 hover:text-accent transition-colors duration-200">{siteContent.contactEmail}</a>
               </div>
               <div className="flex items-center gap-3 group">
                 <Phone className="w-5 h-5 text-accent group-hover:animate-pulse"/>
                 <a href={`tel:${siteContent.contactPhone}`} className="text-foreground/90 hover:text-accent transition-colors duration-200">{siteContent.contactPhone || 'N/A'}</a>
               </div>
               <div className="flex items-start gap-3 group">
                 <MapPin className="w-5 h-5 text-accent mt-1 group-hover:animate-pulse"/>
                 <span className="text-foreground/90 whitespace-pre-wrap">{siteContent.contactAddress || 'Location not specified'}</span>
               </div>
             </CardContent>
           </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
}
