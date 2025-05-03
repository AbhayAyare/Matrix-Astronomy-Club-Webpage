
import Link from 'next/link';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Globe, CalendarDays, Image as ImageIcon, UserPlus, Mail, Phone, MapPin } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { getSiteContent, SiteContent } from '@/services/content'; // Import the service and type
import { collection, getDocs, query, orderBy, Timestamp, where, FirestoreError } from 'firebase/firestore'; // Added FirestoreError
import { ref, listAll, getDownloadURL, StorageError } from 'firebase/storage'; // Added StorageError
import { db, storage } from '@/config/firebase';
import { JoinForm } from '@/components/home/join-form'; // Import JoinForm
import { NewsletterForm } from '@/components/home/newsletter-form'; // Import NewsletterForm

// Define interfaces for events and gallery images fetched from Firebase
interface Event {
  id: string;
  name: string;
  date: Timestamp; // Use Firestore Timestamp
  description: string;
  // Add an optional imageURL field
  imageURL?: string;
}

interface GalleryImage {
  id: string; // Use URL or a unique ID from storage ref name
  src: string;
  alt: string;
}

// Fetch upcoming events from Firestore
async function getUpcomingEvents(): Promise<Event[]> {
  const eventsCollectionRef = collection(db, 'events');
  const today = Timestamp.now(); // Get current timestamp
  const fallbackDate = new Date();
  fallbackDate.setDate(fallbackDate.getDate() + 7); // 1 week from now

  try {
    // Query for events where the date is greater than or equal to today
    const q = query(eventsCollectionRef, where("date", ">=", today), orderBy("date", "asc"));
    const querySnapshot = await getDocs(q);

    const events = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date as Timestamp,
      // Assuming you might store an image URL reference in Firestore
      imageURL: doc.data().imageURL || `https://picsum.photos/seed/${doc.id}/400/250`, // Placeholder if no URL
    })) as Event[];

    return events;
  } catch (error) {
    console.error("Error fetching upcoming events:", error);
    // Handle specific errors like missing index or offline
    if (error instanceof FirestoreError && (error.code === 'unavailable' || error.message.includes('offline'))) {
        console.warn("Offline: Cannot fetch upcoming events. Using fallback.");
    } else if (error instanceof Error && error.message.includes('firestore/indexes')) {
        console.error("Firestore index missing for querying/ordering events by date. Please create it.");
    } else {
        console.error("An unexpected error occurred fetching events.");
    }
    // Return fallback data on error
    return [
      { id: 'fallback1', name: 'Deep Sky Observation Night (Fallback)', date: Timestamp.fromDate(fallbackDate), description: 'Join us for a night under the stars observing distant galaxies and nebulae.', imageURL: 'https://picsum.photos/seed/event1/400/250'},
    ];
  }
}

// Fetch gallery images from Firebase Storage
async function getGalleryImages(): Promise<GalleryImage[]> {
  const galleryListRef = ref(storage, 'gallery');
  try {
    const res = await listAll(galleryListRef);
    if (res.items.length === 0) {
        console.log("No gallery images found.");
        return []; // Return empty if no images found
    }
    const imagePromises = res.items.map(async (itemRef) => {
      const url = await getDownloadURL(itemRef);
      return { id: itemRef.name, src: url, alt: `Gallery image ${itemRef.name}` }; // Use filename as ID and part of alt text
    });
    const images = await Promise.all(imagePromises);
    // Sort images by name if needed
     images.sort((a, b) => a.id.localeCompare(b.id));
    return images;
  } catch (error) {
    console.error("Error fetching gallery images:", error);
     if (error instanceof StorageError && (error.code === 'storage/retry-limit-exceeded' || error.code.includes('offline'))) {
        console.warn("Offline or network issue: Cannot fetch gallery images. Using fallback.");
     } else {
        console.error("An unexpected error occurred fetching gallery images.");
     }
    // Return fallback data on error - fewer images for fallback
    return [
      { id: 'g1', src: 'https://picsum.photos/seed/gallery1/300/200', alt: 'Nebula (Fallback)'},
      { id: 'g2', src: 'https://picsum.photos/seed/gallery2/300/200', alt: 'Galaxy (Fallback)'},
      { id: 'g3', src: 'https://picsum.photos/seed/gallery3/300/200', alt: 'Moon surface (Fallback)'},
      { id: 'g4', src: 'https://picsum.photos/seed/gallery4/300/200', alt: 'Star cluster (Fallback)'},
      { id: 'g5', src: 'https://picsum.photos/seed/gallery5/300/200', alt: 'Planet Jupiter (Fallback)'},
      { id: 'g6', src: 'https://picsum.photos/seed/gallery6/300/200', alt: 'Observatory telescope (Fallback)'},
    ];
  }
}


export default async function Home() {
  // Fetch dynamic data in the Server Component
  const siteContent: SiteContent = await getSiteContent();
  const upcomingEvents: Event[] = await getUpcomingEvents();
  const galleryImages: GalleryImage[] = await getGalleryImages();


  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-8 md:py-12 space-y-16 md:space-y-24 overflow-x-hidden"> {/* Prevent horizontal scroll from animations */}
        {/* Hero Section - Using fetched data */}
        <section id="hero" className="text-center py-16 md:py-24 bg-gradient-to-b from-primary/10 to-transparent rounded-lg shadow-inner animate-fade-in">
           <h1 className="text-4xl md:text-6xl font-bold mb-4 text-primary animate-fade-in" style={{ animationDelay: '0.1s' }}>{siteContent.heroTitle}</h1>
           <p className="text-lg md:text-xl text-foreground/80 max-w-3xl mx-auto mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>{siteContent.heroSubtitle}</p>
           <Button size="lg" asChild className="transform hover:scale-105 transition-transform duration-300 ease-in-out animate-fade-in" style={{ animationDelay: '0.3s' }}>
             <Link href="#join">Join the Club</Link>
           </Button>
        </section>

        {/* About Matrix Section - Using fetched data */}
        <section id="about" className="scroll-mt-20 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <h2 className="text-3xl md:text-4xl font-semibold mb-6 text-primary flex items-center justify-center gap-2"><Globe className="w-8 h-8 text-accent"/>About Matrix</h2>
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardContent className="p-6 md:p-8">
              <p className="text-lg leading-relaxed text-foreground/90">{siteContent.about}</p>
            </CardContent>
          </Card>
        </section>

        <Separator />

        {/* Upcoming Events Section - Using fetched data */}
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
                       // Use event.imageURL if available, otherwise fallback placeholder
                       src={event.imageURL || `https://picsum.photos/seed/${event.id}/400/250`}
                       alt={event.name}
                       fill
                       sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                       className="object-cover transition-transform duration-300 group-hover:scale-105"
                       data-ai-hint="astronomy club event" // Generic hint
                       priority={index < 3} // Prioritize loading for first few images
                     />
                   </div>
                  <CardHeader>
                    <CardTitle className="text-xl">{event.name}</CardTitle>
                    {/* Format Timestamp to readable date string */}
                    <CardDescription>{event.date.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-foreground/80">{event.description}</p>
                  </CardContent>
                   <CardFooter className="flex justify-between items-center mt-auto pt-4"> {/* Added pt-4 */}
                     <Badge variant="secondary" className="bg-accent text-accent-foreground">Upcoming</Badge>
                     {/* Optional: Link to a detailed event page if you have one */}
                     {/* <Button variant="outline" size="sm" asChild className="transform hover:scale-105 transition-transform duration-200">
                        <Link href={`/events/${event.id}`}>Learn More</Link>
                     </Button> */}
                     <Button variant="outline" size="sm" disabled className="transform hover:scale-105 transition-transform duration-200">Learn More</Button>
                   </CardFooter>
                </Card>
              ))}
             </div>
          )}
        </section>

        <Separator />

        {/* Event Gallery Section - Using fetched data */}
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
                        src={image.src}
                        alt={image.alt}
                        width={300}
                        height={200}
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 250px"
                        className="object-cover w-full h-full aspect-[3/2] transform group-hover:scale-105 transition-transform duration-300 ease-in-out" // Added aspect ratio
                        data-ai-hint="astronomy club gallery space" // Generic hint
                        loading={index < 6 ? "eager" : "lazy"} // Load initial images eagerly
                      />
                    </div>
                  ))}
                </div>
             )}
        </section>

        <Separator />

        {/* Join Matrix Section - Using Client Component */}
        <section id="join" className="scroll-mt-20 animate-fade-in" style={{ animationDelay: '1.2s' }}>
          <h2 className="text-3xl md:text-4xl font-semibold mb-8 text-primary flex items-center justify-center gap-2"><UserPlus className="w-8 h-8 text-accent"/>{siteContent.joinTitle}</h2>
          <Card className="max-w-2xl mx-auto shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle>{siteContent.joinTitle}</CardTitle>
              <CardDescription>{siteContent.joinDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <JoinForm /> {/* Use the Client Component */}
            </CardContent>
          </Card>
        </section>

        <Separator />

        {/* Newsletter Subscription Section - Using Client Component */}
        <section id="newsletter" className="scroll-mt-20 animate-fade-in" style={{ animationDelay: '1.3s' }}>
          <h2 className="text-3xl md:text-4xl font-semibold mb-8 text-primary flex items-center justify-center gap-2"><Mail className="w-8 h-8 text-accent"/>{siteContent.newsletterTitle}</h2>
          <Card className="max-w-2xl mx-auto shadow-lg bg-secondary/50 hover:shadow-xl transition-shadow duration-300">
             <CardHeader>
               <CardTitle>{siteContent.newsletterTitle}</CardTitle>
               <CardDescription>{siteContent.newsletterDescription}</CardDescription>
             </CardHeader>
             <CardContent>
              <NewsletterForm /> {/* Use the Client Component */}
             </CardContent>
          </Card>
        </section>

        <Separator />

        {/* Contact Us Section - Using fetched data */}
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
                 <a href={`tel:${siteContent.contactPhone}`} className="text-foreground/90 hover:text-accent transition-colors duration-200">{siteContent.contactPhone || 'N/A'}</a> {/* Ensure N/A if empty */}
               </div>
               <div className="flex items-start gap-3 group">
                 <MapPin className="w-5 h-5 text-accent mt-1 group-hover:animate-pulse"/>
                 {/* Use pre-wrap to maintain potential line breaks in the address */}
                 <span className="text-foreground/90 whitespace-pre-wrap">{siteContent.contactAddress || 'Location not specified'}</span> {/* Fallback for address */}
               </div>
             </CardContent>
           </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
}
