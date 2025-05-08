
'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { GalleryImage } from './gallery-image';
import { Image as ImageIconIcon, AlertCircle, WifiOff, Maximize, X } from 'lucide-react'; // Removed Loader2 as loading is handled by parent
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"; // Corrected import
import Image from 'next/image';
import { Button } from "@/components/ui/button"; // Import Button
import { isOfflineError } from '@/lib/utils'; // Keep for checking error type


export interface GalleryImageMetadata {
  id: string;
  url: string;
  name: string;
  createdAt?: number; // Changed from Timestamp to number (milliseconds) or undefined
}

interface GallerySectionProps {
    galleryImages: GalleryImageMetadata[];
    error: string | null;
}

// Fallback images for display when there's an error and no images are passed
const fallbackImages: GalleryImageMetadata[] = [
    { id: 'g1', url: 'https://picsum.photos/seed/gallery1/600/400', name: 'Nebula (Fallback)'},
    { id: 'g2', url: 'https://picsum.photos/seed/gallery2/600/400', name: 'Galaxy (Fallback)'},
    { id: 'g3', url: 'https://picsum.photos/seed/gallery3/600/400', name: 'Moon surface (Fallback)'},
    { id: 'g4', url: 'https://picsum.photos/seed/gallery4/600/400', name: 'Star cluster (Fallback)'},
    { id: 'g5', url: 'https://picsum.photos/seed/gallery5/600/400', name: 'Planet Jupiter (Fallback)'},
    { id: 'g6', url: 'https://picsum.photos/seed/gallery6/600/400', name: 'Observatory telescope (Fallback)'},
  ];


export function GallerySection({ galleryImages, error }: GallerySectionProps) {
    // No useEffect or useState for fetching needed here

    const displayImages = error && galleryImages.length === 0 ? fallbackImages : galleryImages;
    const isDisplayingFallbacks = error && galleryImages.length === 0;
    const isCurrentlyOffline = error ? isOfflineError(new Error(error)) : false; // Check if the passed error indicates offline

    // Helper function to generate unique IDs for Dialog Title and Description
    const getModalTitleId = (imageId: string): string => `gallery-modal-title-${imageId || 'fallback'}`;
    const getModalDescriptionId = (imageId: string): string => `gallery-modal-description-${imageId || 'fallback'}`;


  return (
    <>
        <h2 className="text-3xl md:text-4xl font-semibold mb-8 text-white flex items-center justify-center gap-2">
            <ImageIconIcon className="w-8 h-8 text-accent"/>Event Gallery
        </h2>
      {/* Error Alert (Only shown if there's an error and no images were fetched, handled globally now) */}
      {/* Example:
      {error && galleryImages.length === 0 && (
          <Alert variant={isCurrentlyOffline ? "default" : "destructive"} className={`mb-4 ${isCurrentlyOffline ? 'border-yellow-500 text-yellow-700 dark:border-yellow-600 dark:text-yellow-300 [&>svg]:text-yellow-500 dark:[&>svg]:text-yellow-400' : ''}`}>
              {isCurrentlyOffline ? <WifiOff className="h-4 w-4"/> : <AlertCircle className="h-4 w-4"/>}
              <AlertTitle>{isCurrentlyOffline ? "Network Issue" : "Gallery Unavailable"}</AlertTitle>
              <AlertDescription>
                  {error} {isDisplayingFallbacks && " Showing fallback images."}
             </AlertDescription>
          </Alert>
      )}
      */}


       {displayImages.length === 0 && !error && (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            The gallery is currently empty. Check back soon!
          </CardContent>
        </Card>
      )}

      {displayImages.length > 0 && (
        <div className="grid grid-cols-gallery gap-4">
          {displayImages.map((image, index) => {
             const modalTitleId = getModalTitleId(image.id);
             const modalDescriptionId = getModalDescriptionId(image.id);
             return (
             <Dialog key={image.id}>
               <DialogTrigger asChild>
                 <div className="overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 group animate-fade-in relative aspect-[3/2] cursor-pointer" style={{ animationDelay: `${1 + index * 0.05}s` }}>
                   <GalleryImage
                     src={image.url}
                     alt={image.name || `Gallery image ${image.id}`}
                     imageId={image.id}
                     loading={index < 6 ? "eager" : "lazy"}
                   />
                     <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                         <Maximize className="h-8 w-8 text-white/80" />
                     </div>
                   <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 text-white text-xs truncate pointer-events-none">
                     {image.name}
                   </div>
                 </div>
               </DialogTrigger>
               <DialogContent
                   className="max-w-3xl p-2 sm:p-4"
                   aria-labelledby={modalTitleId} // Use generated ID
                   aria-describedby={modalDescriptionId} // Ensure this is set
               >
                   <DialogHeader>
                      {/* Ensure DialogTitle is present */}
                      <DialogTitle id={modalTitleId}>{image.name || 'Gallery Image'}</DialogTitle>
                      <DialogDescription id={modalDescriptionId} className="sr-only">
                        Enlarged view of the gallery image: {image.name || 'Unnamed Image'}
                      </DialogDescription>
                      {/* Or provide a visible description */}
                      {/* <DialogDescription id={modalDescriptionId}>
                         Image description or details here...
                      </DialogDescription> */}
                   </DialogHeader>
                   <div className="relative aspect-video">
                       <Image
                         src={image.url}
                         alt={image.name || 'Enlarged gallery image'}
                         fill
                         sizes="(max-width: 768px) 90vw, (max-width: 1280px) 70vw, 1200px"
                         className="rounded-md object-contain"
                         onError={(e) => {
                              console.warn(`Modal Image Load Error: ${image.url}`);
                              e.currentTarget.src = `https://picsum.photos/seed/${image.id}/1200/800`;
                              e.currentTarget.alt = `${image.name} (Fallback)`;
                              e.currentTarget.onerror = null;
                          }}
                          unoptimized={!image.url?.startsWith('/')}
                       />
                   </div>
                    <DialogClose asChild>
                       <Button variant="ghost" size="icon" className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10">
                           <X className="h-4 w-4"/>
                           <span className="sr-only">Close</span>
                       </Button>
                   </DialogClose>
               </DialogContent>
             </Dialog>
             );
          })}
        </div>
      )}
    </>
  );
}
