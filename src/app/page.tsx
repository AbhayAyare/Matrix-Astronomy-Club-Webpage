import Link from 'next/link';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Globe, CalendarDays, Image as ImageIcon, UserPlus, Mail, Send, Phone, MapPin } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

// Placeholder data - replace with Firebase fetching logic
const aboutContent = "Matrix is a passionate community dedicated to exploring the wonders of the universe. We organize stargazing sessions, workshops, and talks for enthusiasts of all levels.";
const upcomingEvents = [
  { id: '1', name: 'Deep Sky Observation Night', date: '2024-08-15', description: 'Join us for a night under the stars observing distant galaxies and nebulae.', image: 'https://picsum.photos/seed/event1/400/250', dataAiHint: "night sky stars telescope"},
  { id: '2', name: 'Astrophotography Workshop', date: '2024-09-05', description: 'Learn the basics of capturing stunning images of the night sky.', image: 'https://picsum.photos/seed/event2/400/250', dataAiHint: "astrophotography camera milky way"},
  { id: '3', name: 'Talk: The Search for Exoplanets', date: '2024-09-20', description: 'Guest speaker discusses the latest discoveries in exoplanet research.', image: 'https://picsum.photos/seed/event3/400/250', dataAiHint: "exoplanet space presentation"},
];
const galleryImages = [
  { id: 'g1', src: 'https://picsum.photos/seed/gallery1/300/200', alt: 'Nebula', dataAiHint: "nebula colorful space"},
  { id: 'g2', src: 'https://picsum.photos/seed/gallery2/300/200', alt: 'Galaxy', dataAiHint: "galaxy spiral stars"},
  { id: 'g3', src: 'https://picsum.photos/seed/gallery3/300/200', alt: 'Moon surface', dataAiHint: "moon surface craters"},
  { id: 'g4', src: 'https://picsum.photos/seed/gallery4/300/200', alt: 'Star cluster', dataAiHint: "star cluster bright"},
  { id: 'g5', src: 'https://picsum.photos/seed/gallery5/300/200', alt: 'Planet Jupiter', dataAiHint: "jupiter planet gas giant"},
  { id: 'g6', src: 'https://picsum.photos/seed/gallery6/300/200', alt: 'Observatory telescope', dataAiHint: "observatory telescope dome"},
];
const contactInfo = {
  email: "info@matrixastronomy.org",
  phone: "+1 (555) 123-4567",
  address: "123 Cosmos Avenue, Starlight City, ST 98765"
};

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-8 md:py-12 space-y-16 md:space-y-24">
        {/* Hero Section */}
        <section id="hero" className="text-center py-16 md:py-24 bg-gradient-to-b from-primary/10 to-background rounded-lg shadow-inner animate-fade-in">
           <h1 className="text-4xl md:text-6xl font-bold mb-4 text-primary">Welcome to Matrix Astronomy Hub</h1>
           <p className="text-lg md:text-xl text-foreground/80 max-w-3xl mx-auto mb-8">Your gateway to the cosmos. Explore, learn, and connect with fellow space enthusiasts.</p>
           <Button size="lg" asChild className="transform hover:scale-105 transition-transform duration-200">
             <Link href="#join">Join the Club</Link>
           </Button>
        </section>

        {/* About Matrix Section */}
        <section id="about" className="scroll-mt-20">
          <h2 className="text-3xl md:text-4xl font-semibold mb-6 text-primary flex items-center justify-center gap-2"><Globe className="w-8 h-8 text-accent"/>About Matrix</h2>
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardContent className="p-6 md:p-8">
              <p className="text-lg leading-relaxed text-foreground/90">{aboutContent}</p>
            </CardContent>
          </Card>
        </section>

        <Separator />

        {/* Upcoming Events Section */}
        <section id="events" className="scroll-mt-20">
          <h2 className="text-3xl md:text-4xl font-semibold mb-8 text-primary flex items-center justify-center gap-2"><CalendarDays className="w-8 h-8 text-accent"/>Upcoming Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {upcomingEvents.map((event) => (
              <Card key={event.id} className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 ease-in-out">
                <div className="relative h-48 w-full overflow-hidden">
                   <Image
                     src={event.image}
                     alt={event.name}
                     layout="fill"
                     objectFit="cover"
                     data-ai-hint={event.dataAiHint}
                     className="transition-transform duration-300 group-hover:scale-105" // Added group-hover for image zoom on card hover
                   />
                </div>
                <CardHeader>
                  <CardTitle className="text-xl">{event.name}</CardTitle>
                  <CardDescription>{new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-foreground/80">{event.description}</p>
                </CardContent>
                <CardFooter className="flex justify-between items-center mt-auto">
                   <Badge variant="secondary" className="bg-accent text-accent-foreground">Paid Event</Badge>
                   <Button variant="outline" size="sm" className="transform hover:scale-105 transition-transform duration-200">Learn More</Button>
                 </CardFooter>
              </Card>
            ))}
          </div>
        </section>

        <Separator />

        {/* Event Gallery Section */}
        <section id="gallery" className="scroll-mt-20">
           <h2 className="text-3xl md:text-4xl font-semibold mb-8 text-primary flex items-center justify-center gap-2"><ImageIcon className="w-8 h-8 text-accent"/>Event Gallery</h2>
          <div className="grid grid-cols-gallery gap-4">
            {galleryImages.map((image) => (
              <div key={image.id} className="aspect-w-3 aspect-h-2 overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 group">
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={300}
                  height={200}
                  className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-300 ease-in-out" // Simplified hover effect
                   data-ai-hint={image.dataAiHint}
                />
              </div>
            ))}
          </div>
        </section>

        <Separator />

        {/* Join Matrix Section */}
        <section id="join" className="scroll-mt-20">
          <h2 className="text-3xl md:text-4xl font-semibold mb-8 text-primary flex items-center justify-center gap-2"><UserPlus className="w-8 h-8 text-accent"/>Join Matrix</h2>
          <Card className="max-w-2xl mx-auto shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle>Become a Member</CardTitle>
              <CardDescription>Fill out the form below to start your cosmic journey with us.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <Input placeholder="Full Name" required />
                <Input type="email" placeholder="Email Address" required />
                <Textarea placeholder="Tell us a bit about your interest in astronomy (optional)" />
                <Button type="submit" className="w-full transform hover:scale-105 transition-transform duration-200">Submit Application</Button>
              </form>
            </CardContent>
          </Card>
        </section>

        <Separator />

        {/* Newsletter Subscription Section */}
        <section id="newsletter" className="scroll-mt-20">
          <h2 className="text-3xl md:text-4xl font-semibold mb-8 text-primary flex items-center justify-center gap-2"><Mail className="w-8 h-8 text-accent"/>Stay Updated</h2>
          <Card className="max-w-2xl mx-auto shadow-lg bg-secondary/50 hover:shadow-xl transition-shadow duration-300">
             <CardHeader>
               <CardTitle>Subscribe to Our Newsletter</CardTitle>
               <CardDescription>Get the latest news, event announcements, and astronomical insights delivered to your inbox.</CardDescription>
             </CardHeader>
             <CardContent>
              <form className="flex gap-2">
                <Input type="email" placeholder="Enter your email" required className="flex-grow" />
                <Button type="submit" variant="default" className="transform hover:scale-105 transition-transform duration-200">
                   <Send className="w-4 h-4 mr-2"/>
                   Subscribe
                 </Button>
              </form>
             </CardContent>
          </Card>
        </section>

        <Separator />

        {/* Contact Us Section */}
        <section id="contact" className="scroll-mt-20">
          <h2 className="text-3xl md:text-4xl font-semibold mb-8 text-primary flex items-center justify-center gap-2"><Phone className="w-8 h-8 text-accent"/>Contact Us</h2>
           <Card className="max-w-2xl mx-auto shadow-lg hover:shadow-xl transition-shadow duration-300">
             <CardContent className="p-6 md:p-8 space-y-4">
               <div className="flex items-center gap-3">
                 <Mail className="w-5 h-5 text-accent"/>
                 <a href={`mailto:${contactInfo.email}`} className="text-foreground/90 hover:text-accent transition-colors">{contactInfo.email}</a>
               </div>
               <div className="flex items-center gap-3">
                 <Phone className="w-5 h-5 text-accent"/>
                 <span className="text-foreground/90">{contactInfo.phone}</span>
               </div>
               <div className="flex items-start gap-3">
                 <MapPin className="w-5 h-5 text-accent mt-1"/>
                 <span className="text-foreground/90">{contactInfo.address}</span>
               </div>
             </CardContent>
           </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
}
