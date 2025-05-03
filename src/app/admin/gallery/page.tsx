
'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useFirebase } from '@/context/firebase-provider';
// Firestore imports remain
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, serverTimestamp, Timestamp, FirestoreError } from 'firebase/firestore';
// Storage imports REMOVED
// import { ref, uploadBytes, getDownloadURL, deleteObject, StorageReference, StorageError } from 'firebase/storage';
import { Loader2, Upload, Trash2, Image as ImageIcon, WifiOff, Link as LinkIcon } from 'lucide-react'; // Added LinkIcon
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';

// Collection name in Firestore
const GALLERY_COLLECTION = 'gallery';
// Storage folder REMOVED
// const GALLERY_STORAGE_FOLDER = 'gallery';

// Interface for Gallery Image Metadata stored in Firestore
// Removed storagePath
interface GalleryImageMetadata {
  id: string; // Firestore document ID
  url: string; // URL of the image (can be external or placeholder)
  name: string; // Name/description for the image
  createdAt: Timestamp;
}

export default function AdminGalleryPage() {
  // Remove storage from useFirebase hook
  const { db } = useFirebase();
  const { toast } = useToast();
  const [images, setImages] = useState<GalleryImageMetadata[]>([]); // State holds Firestore metadata
  const [loading, setLoading] = useState(true);
  // Renamed uploading to savingMetadata as we are not uploading files anymore
  const [savingMetadata, setSavingMetadata] = useState(false);
  // State for the image URL input
  const [imageUrl, setImageUrl] = useState('');
  // State for the image name/description input
  const [imageName, setImageName] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null); // Track Firestore doc ID being deleted
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  const galleryCollectionRef = collection(db, GALLERY_COLLECTION);

  // Fetch image metadata from Firestore on load (no changes needed here)
  const fetchImages = async () => {
    setLoading(true);
    setFetchError(null);
    setIsOffline(false);
    try {
      const q = query(galleryCollectionRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const fetchedImages = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt as Timestamp,
      })) as GalleryImageMetadata[];
      setImages(fetchedImages);
    } catch (error) {
        console.error("Error fetching gallery metadata:", error);
        let errorMessage = "Failed to load gallery images.";
         if (error instanceof FirestoreError) {
             if (error.code === 'failed-precondition') {
                  errorMessage = `A Firestore index is required for the '${GALLERY_COLLECTION}' collection ordered by 'createdAt' descending. Please create it in the Firebase console.`;
                  toast({ title: "Index Required", description: errorMessage, variant: "destructive", duration: 10000 });
             } else if (error.code === 'unavailable' || error.message.includes('offline')) {
                 errorMessage = "Cannot load gallery. You appear to be offline.";
                 setIsOffline(true);
             }
         } else {
             // Keep generic message for other errors
         }
        setFetchError(errorMessage);
        if (!(error instanceof FirestoreError && error.code === 'failed-precondition')) {
            toast({
              title: "Error",
              description: errorMessage,
              variant: "destructive",
            });
        }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
        setIsOffline(!navigator.onLine);
        const handleOnline = () => { setIsOffline(false); fetchImages(); };
        const handleOffline = () => { setIsOffline(true); };
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        fetchImages();
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    } else {
        fetchImages();
    }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db]);


  // REMOVED handleFileChange

  // Handle Add Metadata: Saves metadata (URL, name) to Firestore
  const handleAddMetadata = async () => {
    // Validate inputs
    if (!imageUrl || !imageName) {
      toast({ title: "Missing Info", description: "Please enter both an image URL and a name/description.", variant: "destructive" });
      return;
    }
    // Basic URL validation (optional but recommended)
    try {
        new URL(imageUrl); // Check if it's a valid URL structure
    } catch (_) {
         toast({ title: "Invalid URL", description: "Please enter a valid image URL (e.g., https://...)", variant: "destructive" });
         return;
    }

    if (isOffline) {
        toast({ title: "Offline", description: "Cannot save metadata while offline.", variant: "destructive" });
        return;
    }

    setSavingMetadata(true);
    console.log("Starting metadata save...");

    try {
      // 1. Prepare metadata for Firestore
      const imageMetadata = {
        url: imageUrl,
        name: imageName,
        createdAt: serverTimestamp() // Use server timestamp
      };

      // 2. Add metadata document to Firestore
      console.log("Adding metadata to Firestore collection:", GALLERY_COLLECTION);
      const docRef = await addDoc(galleryCollectionRef, imageMetadata);
      console.log("Metadata added to Firestore with ID:", docRef.id);

      // 3. Update local state optimistically
       const newImageMetadata: GalleryImageMetadata = {
         id: docRef.id, // Use the generated Firestore ID
         url: imageUrl,
         name: imageName,
         createdAt: Timestamp.now(), // Approximate timestamp locally
       };
       setImages(prevImages => [newImageMetadata, ...prevImages]); // Add to start for newest first
       console.log("Local state updated.");

      toast({ title: "Success", description: "Image metadata added to gallery." });
      setImageUrl(''); // Clear inputs
      setImageName('');

    } catch (error) {
      console.error("Error during metadata save process:", error);
      let errorMessage = "Failed to save image metadata.";
      // Differentiate Firestore errors
       if (error instanceof FirestoreError) {
          errorMessage = `Firestore Error: ${error.code}. Check console & rules.`;
          console.error("Detailed Firestore Error:", error.code, error.message);
           if (error.code === 'permission-denied') {
               errorMessage += " Check Firestore security rules.";
           } else if (error.code === 'unavailable' || error.message.includes('offline')) {
               errorMessage = "Cannot save metadata. Firestore offline or network issue.";
               setIsOffline(true);
           }
      } else {
          // Handle generic errors
          errorMessage = `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`;
          console.error("Unexpected save error:", error);
      }

      toast({
        title: "Save Error",
        description: errorMessage,
        variant: "destructive",
        duration: 9000, // Show longer for errors
      });
    } finally {
      // Crucial: Reset saving state
      setSavingMetadata(false);
      console.log("Metadata save process finished, resetting saving state.");
    }
  };

  // Handle Delete: Deletes Firestore doc ONLY
  const handleDelete = async (imageMeta: GalleryImageMetadata) => {
    if (isOffline) {
        toast({ title: "Offline", description: "Cannot delete image metadata while offline.", variant: "destructive" });
        return;
    }
    setDeletingId(imageMeta.id);
    try {
       // 1. Delete Firestore document
       console.log(`Deleting Firestore document: ${GALLERY_COLLECTION}/${imageMeta.id}`);
       const imageDocRef = doc(db, GALLERY_COLLECTION, imageMeta.id);
       await deleteDoc(imageDocRef);
       console.log("Firestore document deleted successfully.");

       // Storage deletion REMOVED

      // 2. Update local state
      setImages(images.filter(img => img.id !== imageMeta.id));
      toast({ title: "Success", description: "Image metadata deleted successfully." });

    } catch (error) {
       console.error("Error deleting image metadata:", error);
       let errorMessage = "Failed to delete image metadata.";
       if (error instanceof FirestoreError && (error.code === 'unavailable' || error.message.includes('offline'))) {
           errorMessage = "Cannot delete metadata. Firestore offline.";
           setIsOffline(true);
       } else {
           errorMessage = `Deletion failed: ${error instanceof Error ? error.message : String(error)}`;
           console.error("Detailed Delete Error:", error);
       }

        toast({
           title: "Deletion Error",
           description: errorMessage,
           variant: "destructive",
           duration: 7000,
        });

    } finally {
      setDeletingId(null);
    }
  };


  const getDialogTitleId = (imageId: string) => `delete-image-dialog-title-${imageId}`;
  const getDialogDescriptionId = (imageId: string) => `delete-image-dialog-description-${imageId}`;


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Gallery Management</h1>
      {/* Updated description */}
      <p className="text-muted-foreground">Add or delete image metadata (URL and name) for the public gallery. Images are stored elsewhere (e.g., external host, CDN).</p>

      {isOffline && (
         <Alert variant="default" className="border-yellow-500 text-yellow-700 dark:border-yellow-600 dark:text-yellow-300 [&>svg]:text-yellow-500 dark:[&>svg]:text-yellow-400">
             <WifiOff className="h-4 w-4"/>
             <AlertTitle>Offline Mode</AlertTitle>
             <AlertDescription>You appear to be offline. Functionality may be limited.</AlertDescription>
         </Alert>
       )}

      {/* Add Metadata Section */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Image Metadata</CardTitle>
          <CardDescription>Enter the direct URL and a name/description for the image.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
             <Label htmlFor="imageUrl">Image URL</Label>
             <Input
                id="imageUrl"
                type="url"
                placeholder="https://example.com/path/to/your/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                disabled={savingMetadata || isOffline}
                className="transition-colors duration-200 focus:border-accent"
             />
          </div>
          <div className="space-y-2">
             <Label htmlFor="imageName">Name / Description</Label>
             <Input
                id="imageName"
                type="text"
                placeholder="e.g., Andromeda Galaxy, Telescope Setup"
                value={imageName}
                onChange={(e) => setImageName(e.target.value)}
                disabled={savingMetadata || isOffline}
                className="transition-colors duration-200 focus:border-accent"
             />
          </div>
          <Button onClick={handleAddMetadata} disabled={savingMetadata || isOffline || !imageUrl || !imageName}>
            {savingMetadata && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isOffline ? <WifiOff className="mr-2 h-4 w-4" /> : <LinkIcon className="mr-2 h-4 w-4" />}
            {savingMetadata ? 'Saving...' : isOffline ? 'Offline' : 'Add Image Metadata'}
          </Button>
        </CardContent>
      </Card>

      {/* Image Grid Section - Fetched from Firestore */}
      <Card>
        <CardHeader>
          <CardTitle>Current Gallery Images</CardTitle>
          <CardDescription>Manage existing image metadata stored in Firestore. Hover over an image to delete its entry.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2">Loading Images...</span></div>
          ) : fetchError && !isOffline ? (
             <Alert variant="destructive">
               <AlertCircle className="h-4 w-4" />
               <AlertTitle>Error Loading Gallery</AlertTitle>
               <AlertDescription>{fetchError}</AlertDescription>
             </Alert>
          ) : fetchError && isOffline ? (
             <Alert variant="default" className="border-yellow-500 text-yellow-700 dark:border-yellow-600 dark:text-yellow-300 [&>svg]:text-yellow-500 dark:[&>svg]:text-yellow-400">
               <AlertCircle className="h-4 w-4" />
               <AlertTitle>Network Error</AlertTitle>
               <AlertDescription>{fetchError}</AlertDescription>
             </Alert>
          ) : images.length === 0 && !loading ? (
             <p className="text-center text-muted-foreground p-6">No image metadata in the gallery yet. Add some!</p>
          ) : (
            <div className="grid grid-cols-gallery gap-4">
              {images.map((imageMeta) => {
                const titleId = getDialogTitleId(imageMeta.id);
                const descriptionId = getDialogDescriptionId(imageMeta.id);
                // Use placeholder if URL is invalid or missing, although validation should prevent saving invalid URLs
                const imageUrlToDisplay = imageMeta.url || `https://picsum.photos/seed/${imageMeta.id}/300/200`;

                return (
                  <div key={imageMeta.id} className="relative group border rounded-lg overflow-hidden shadow">
                    <Image
                      src={imageUrlToDisplay} // URL from Firestore document
                      alt={imageMeta.name || "Gallery image"} // Name from Firestore document
                      width={300}
                      height={200}
                      className="object-cover w-full h-full aspect-[3/2]"
                      data-ai-hint="astronomy club gallery"
                      onError={(e) => {
                         console.warn(`Failed to load image: ${imageUrlToDisplay}`);
                         e.currentTarget.src = `https://picsum.photos/seed/${imageMeta.id}/300/200`; // Fallback placeholder
                       }}
                       unoptimized={!imageUrlToDisplay.startsWith('/')} // Consider disabling optimization for external URLs
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                              variant="destructive"
                              size="icon"
                              disabled={deletingId === imageMeta.id || isOffline}
                              aria-label={`Delete metadata for image ${imageMeta.name}`}
                          >
                            {deletingId === imageMeta.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                            <span className="sr-only">Delete Image Metadata</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent
                          aria-labelledby={titleId}
                          aria-describedby={descriptionId}
                        >
                          <AlertDialogHeader>
                            <AlertDialogTitle id={titleId}>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription id={descriptionId}>
                              This action cannot be undone. This will permanently delete the image metadata entry from Firestore for:
                              <span className="font-medium break-all block mt-1"> {imageMeta.name} </span>
                              {/* Removed mention of Storage file */}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(imageMeta)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Yes, delete it
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                    {/* Optional: Display name overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 text-white text-xs truncate pointer-events-none">
                      {imageMeta.name}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
