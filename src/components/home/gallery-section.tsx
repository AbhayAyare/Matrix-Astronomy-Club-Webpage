
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { GalleryImage } from './gallery-image'; // Ensure this component exists and is client-compatible
import { Image as ImageIconIcon, AlertCircle, Loader2, WifiOff, Maximize } from 'lucide-react';
import { collection, getDocs, query, orderBy, limit, Timestamp, FirestoreError } from 'firebase/firestore';
import { useFirebase } from '@/context/firebase-provider';
import { Dialog, DialogContent, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import Image from 'next/image'; // Use next/image for modal content

interface GalleryImageMetadata {
  id: string;
  url: string;
  name: string;
  createdAt?: Timestamp; // Optional, but good for ordering
}

interface FetchResult<T> {
  data: T[];
  error: string | null;
}

// Helper function to check for offline errors
function isOfflineError(error: any): boolean {
    const message = String(error?.message ?? '').toLowerCase();
    if (error instanceof FirestoreError) {
      return error.code === 'unavailable' ||
             message.includes('offline') ||
             message.includes('failed to get document because the client is offline') ||
             message.includes('could not reach cloud firestore backend');
    }
    return error instanceof Error && (
        message.includes('network error') ||
        message.includes('client is offline') ||
        message.includes('could not reach cloud firestore backend')
    );
  }


export function GallerySection() {
  const { db } = useFirebase();
  const [galleryImages, setGalleryImages] = useState<GalleryImageMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  const galleryCollectionName = 'gallery';
  const fallbackImages: GalleryImageMetadata[] = [
      { id: 'g1', url: 'https://picsum.photos/seed/gallery1/600/400', name: 'Nebula (Fallback)'},
      { id: 'g2', url: 'https://picsum.photos/seed/gallery2/600/400', name: 'Galaxy (Fallback)'},
      { id: 'g3', url: 'https://picsum.photos/seed/gallery3/600/400', name: 'Moon surface (Fallback)'},
      { id: 'g4', url: 'https://picsum.photos/seed/gallery4/600/400', name: 'Star cluster (Fallback)'},
      { id: 'g5', url: 'https://picsum.photos/seed/gallery5/600/400', name: 'Planet Jupiter (Fallback)'},
      { id: 'g6', url: 'https://picsum.photos/seed/gallery6/600/400', name: 'Observatory telescope (Fallback)'},
    ];


  useEffect(() => {
    const fetchGallery = async () => {
      setLoading(true);
      setFetchError(null);
      setIsOffline(false); // Assume online initially

      if (!db) {
        setFetchError("Database not initialized.");
        setLoading(false);
        return;
      }

      const galleryCollectionRef = collection(db, galleryCollectionName);
      let errorMessage: string | null = null;

      try {
        const q = query(galleryCollectionRef, orderBy("createdAt", "desc"), limit(12));
        console.log(`[GallerySection] Executing getDocs query for '${galleryCollectionName}'...`);
        const querySnapshot = await getDocs(q);
        console.log(`[GallerySection] Fetched ${querySnapshot.size} gallery images.`);

        if (querySnapshot.empty) {
          console.log("[GallerySection] No gallery images found.");
          setGalleryImages([]); // Ensure state is empty
        } else {
          const images = querySnapshot.docs.map(doc => ({
            id: doc.id,
            url: doc.data().url as string,
            name: doc.data().name as string,
            createdAt: doc.data().createdAt as Timestamp, // Keep timestamp if available
          })) as GalleryImageMetadata[];
          setGalleryImages(images);
        }
      } catch (error) {
        console.error(`[GallerySection] Error fetching gallery:`, error);
        if (isOfflineError(error)) {
             errorMessage = `Offline/Unavailable: Could not connect to Firestore to fetch gallery images (${(error as FirestoreError)?.code}). Using fallback data.`;
             console.warn(`[GallerySection] ${errorMessage}`);
             setIsOffline(true); // Set offline state
          } else if (error instanceof FirestoreError) {
             if (error.code === 'permission-denied') {
                 errorMessage = `Permission Denied: Could not read collection '${galleryCollectionName}'. Check Firestore rules.`;
                 console.error(`[GallerySection] CRITICAL: ${errorMessage}`);
             } else if (error.code === 'failed-precondition') {
                  errorMessage = `Index Required: Firestore query needs an index on 'createdAt' descending. Create it in Firebase. Using fallback data.`;
                 console.error(`[GallerySection] ACTION NEEDED: ${errorMessage}`);
             } else {
                 errorMessage = `Firestore Error (${error.code}): ${error.message}. Using fallback data.`;
             }
          } else {
             errorMessage = `Unexpected Error: ${error instanceof Error ? error.message : String(error)}. Using fallback data.`;
          }
        setFetchError(errorMessage);
        setGalleryImages(fallbackImages); // Use fallback on error
      } finally {
        setLoading(false);
      }
    };

    fetchGallery();
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db]); // Depend on db instance

  return (
    <section id="gallery" className="scroll-mt-20 animate-fade-in" style={{ animationDelay: '0.9s' }}>
      <h2 className="text-3xl md:text-4xl font-semibold mb-8 text-primary flex items-center justify-center gap-2">
        <ImageIconIcon className="w-8 h-8 text-accent"/>Event Gallery
      </h2>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2">Loading Gallery...</span></div>
      )}

      {/* Error State */}
      {!loading && fetchError && (
          <Alert variant={isOffline ? "default" : "destructive"} className={`mb-4 ${isOffline ? 'border-yellow-500 text-yellow-700 dark:border-yellow-600 dark:text-yellow-300 [&>svg]:text-yellow-500 dark:[&>svg]:text-yellow-400' : ''}`}>
              {isOffline ? <WifiOff className="h-4 w-4"/> : <AlertCircle className="h-4 w-4"/>}
              <AlertTitle>{isOffline ? "Network Issue" : "Gallery Unavailable"}</AlertTitle>
              <AlertDescription>
                  {fetchError} {!isOffline && "Showing fallback images."}
                  {isOffline && "Showing fallback images. Functionality may be limited."}
             </AlertDescription>
          </Alert>
      )}


       {/* Empty State (Only show if not loading and no error resulted in fallback) */}
       {!loading && galleryImages.length === 0 && !(fetchError && fallbackImages.length > 0) && (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            The gallery is currently empty. Check back soon!
          </CardContent>
        </Card>
      )}

      {/* Gallery Grid */}
      {!loading && galleryImages.length > 0 && (
        <div className="grid grid-cols-gallery gap-4">
          {galleryImages.map((image, index) => (
             <Dialog key={image.id}>
               <DialogTrigger asChild>
                 <div className="overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 group animate-fade-in relative aspect-[3/2] cursor-pointer" style={{ animationDelay: `${1 + index * 0.05}s` }}>
                   <GalleryImage
                     src={image.url}
                     alt={image.name || `Gallery image ${image.id}`}
                     imageId={image.id}
                     loading={index < 6 ? "eager" : "lazy"}
                   />
                    {/* Subtle overlay/icon on hover */}
                     <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                         <Maximize className="h-8 w-8 text-white/80" />
                     </div>
                   {/* Optional: Name overlay */}
                   <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 text-white text-xs truncate pointer-events-none">
                     {image.name}
                   </div>
                 </div>
               </DialogTrigger>
               <DialogContent className="max-w-3xl p-2 sm:p-4">
                   <Image
                     src={image.url}
                     alt={image.name || 'Enlarged gallery image'}
                     width={1200} // Adjust width as needed
                     height={800} // Adjust height as needed
                      style={{ width: '100%', height: 'auto' }} // Make it responsive
                     className="rounded-md object-contain"
                     onError={(e) => {
                          console.warn(`Modal Image Load Error: ${image.url}`);
                          e.currentTarget.src = `https://picsum.photos/seed/${image.id}/1200/800`; // Larger fallback
                          e.currentTarget.alt = `${image.name} (Fallback)`;
                          e.currentTarget.onerror = null;
                      }}
                      unoptimized={!image.url?.startsWith('/')}
                   />
                    <DialogClose className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors">
                         <span className="sr-only">Close</span>
                     </DialogClose>
                     {/* Optional: Add title/description inside modal */}
                     <p className="text-center text-sm text-muted-foreground mt-2">{image.name}</p>
               </DialogContent>
             </Dialog>
          ))}
        </div>
      )}
    </section>
  );
}
