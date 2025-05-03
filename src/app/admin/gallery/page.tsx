'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useFirebase } from '@/context/firebase-provider';
// Firestore imports
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, serverTimestamp, Timestamp, FirestoreError, setDoc } from 'firebase/firestore';
// Storage imports
import { ref, uploadBytes, getDownloadURL, deleteObject, StorageReference, StorageError } from 'firebase/storage';
import { Loader2, Upload, Trash2, Image as ImageIcon, WifiOff } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';

// Collection name in Firestore
const GALLERY_COLLECTION = 'gallery';
// Folder in Storage
const GALLERY_STORAGE_FOLDER = 'gallery';

// Interface for Gallery Image Metadata stored in Firestore
interface GalleryImageMetadata {
  id: string; // Firestore document ID
  url: string; // Download URL from Storage
  name: string; // Original file name or generated name
  storagePath: string; // Full path in Firebase Storage (for deletion)
  createdAt: Timestamp;
}

export default function AdminGalleryPage() {
  const { db, storage } = useFirebase(); // Get both db and storage
  const { toast } = useToast();
  const [images, setImages] = useState<GalleryImageMetadata[]>([]); // State holds Firestore metadata
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null); // Track Firestore doc ID being deleted
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  const galleryCollectionRef = collection(db, GALLERY_COLLECTION);

  // Fetch image metadata from Firestore on load
  const fetchImages = async () => {
    setLoading(true);
    setFetchError(null);
    setIsOffline(false);
    try {
      // Query Firestore, order by creation time descending
      const q = query(galleryCollectionRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const fetchedImages = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt as Timestamp, // Ensure correct type
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
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db]); // Dependency on db instance

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      // Basic file type validation (optional but recommended)
      if (!e.target.files[0].type.startsWith('image/')) {
           toast({ title: "Invalid File", description: "Please select an image file.", variant: "destructive" });
           setSelectedFile(null);
           const fileInput = document.getElementById('gallery-upload') as HTMLInputElement;
           if(fileInput) fileInput.value = ''; // Clear input
           return;
      }
      setSelectedFile(e.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  // Handle Upload: Uploads to Storage, then saves metadata to Firestore
  const handleUpload = async () => {
    if (!selectedFile) {
      toast({ title: "No File", description: "Please select an image file.", variant: "destructive" });
      return;
    }
    setUploading(true);
    console.log("Starting image upload...");

    const uniqueFileName = `${Date.now()}_${selectedFile.name}`;
    const storagePath = `${GALLERY_STORAGE_FOLDER}/${uniqueFileName}`;
    const imageRef = ref(storage, storagePath); // Ref in Storage
    let uploadedStoragePath: string | null = null; // Track if upload succeeded

    try {
      // 1. Upload file to Storage
      console.log(`Uploading ${selectedFile.name} to ${storagePath}...`);
      const snapshot = await uploadBytes(imageRef, selectedFile);
      uploadedStoragePath = snapshot.ref.fullPath; // Confirm upload success
      console.log("File uploaded successfully to Storage:", uploadedStoragePath);

      // 2. Get download URL
      console.log("Getting download URL...");
      const url = await getDownloadURL(snapshot.ref);
      console.log("Download URL obtained:", url);

      // 3. Prepare metadata for Firestore
      const imageMetadata = {
        url: url,
        name: selectedFile.name,
        storagePath: storagePath,
        createdAt: serverTimestamp() // Use server timestamp
      };

      // 4. Add metadata document to Firestore
      console.log("Adding metadata to Firestore collection:", GALLERY_COLLECTION);
      // Use addDoc to let Firestore generate the ID
      const docRef = await addDoc(galleryCollectionRef, imageMetadata);
      console.log("Metadata added to Firestore with ID:", docRef.id);


      // 5. Update local state optimistically
       const newImageMetadata: GalleryImageMetadata = {
         id: docRef.id, // Use the generated Firestore ID
         url: url,
         name: selectedFile.name,
         storagePath: storagePath,
         createdAt: Timestamp.now(), // Approximate timestamp locally
       };
       setImages(prevImages => [newImageMetadata, ...prevImages]); // Add to start for newest first
       console.log("Local state updated.");

      toast({ title: "Success", description: "Image uploaded and added to gallery." });
      setSelectedFile(null); // Clear selection
      const fileInput = document.getElementById('gallery-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = ''; // Reset file input

    } catch (error) {
      console.error("Error during image upload process:", error);
      let errorMessage = "Failed to upload image.";
      if (error instanceof StorageError) {
          errorMessage = `Storage Error: ${error.code}. ${error.message}`;
          if (error.code === 'storage/unauthorized') {
              errorMessage += " Check Storage security rules.";
          } else if (error.code === 'storage/retry-limit-exceeded' || error.code.includes('offline')) {
               errorMessage = "Cannot upload. Storage offline or network issue.";
               setIsOffline(true);
           }
      } else if (error instanceof FirestoreError) {
          errorMessage = `Firestore Error: ${error.code}. ${error.message}`;
           if (error.code === 'permission-denied') {
               errorMessage += " Check Firestore security rules.";
           } else if (error.code === 'unavailable' || error.message.includes('offline')) {
               errorMessage = "Cannot save metadata. Firestore offline or network issue.";
               setIsOffline(true);
           }
           // Attempt to delete the uploaded file if metadata save failed
           if (uploadedStoragePath) {
               console.warn("Firestore save failed after storage upload. Attempting cleanup...");
               const orphanRef = ref(storage, uploadedStoragePath);
               try { await deleteObject(orphanRef); console.log("Cleaned up orphaned storage file:", uploadedStoragePath); } catch (cleanupError) { console.error("Failed to clean up orphaned storage file:", cleanupError); }
           }
      } else {
          // Handle generic errors
          errorMessage = `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`;
          // Attempt cleanup for generic errors too, just in case upload succeeded partially
          if (uploadedStoragePath) {
              console.warn("Generic error after storage upload. Attempting cleanup...");
              const orphanRef = ref(storage, uploadedStoragePath);
              try { await deleteObject(orphanRef); console.log("Cleaned up potentially orphaned storage file:", uploadedStoragePath); } catch (cleanupError) { console.error("Failed to clean up potentially orphaned storage file:", cleanupError); }
          }
      }

      toast({
        title: "Upload Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      // THIS IS CRUCIAL: Always reset the uploading state
      setUploading(false);
      console.log("Upload process finished, resetting loading state.");
    }
  };

  // Handle Delete: Deletes Firestore doc AND Storage file
  const handleDelete = async (imageMeta: GalleryImageMetadata) => {
    setDeletingId(imageMeta.id); // Indicate Firestore doc ID being deleted
    try {
       // 1. Delete Firestore document
       console.log(`Deleting Firestore document: ${GALLERY_COLLECTION}/${imageMeta.id}`);
       const imageDocRef = doc(db, GALLERY_COLLECTION, imageMeta.id);
       await deleteDoc(imageDocRef);
       console.log("Firestore document deleted successfully.");

       // 2. Delete file from Storage using the stored path
       console.log(`Deleting file from Storage: ${imageMeta.storagePath}`);
       const storageRefToDelete = ref(storage, imageMeta.storagePath);
       await deleteObject(storageRefToDelete);
       console.log("Storage file deleted successfully.");

      // 3. Update local state
      setImages(images.filter(img => img.id !== imageMeta.id));
      toast({ title: "Success", description: "Image deleted successfully." });

    } catch (error) {
       console.error("Error deleting image:", error);
       let errorMessage = "Failed to delete image.";
       if (error instanceof FirestoreError && (error.code === 'unavailable' || error.message.includes('offline'))) {
           errorMessage = "Cannot delete metadata. Firestore offline.";
           setIsOffline(true);
       } else if (error instanceof StorageError && (error.code === 'storage/object-not-found')) {
           console.warn("Storage object not found during delete, but proceeding to remove Firestore entry.");
           // Allow deletion from Firestore even if storage object is missing
           setImages(images.filter(img => img.id !== imageMeta.id)); // Update state anyway
           toast({ title: "Partial Success", description: "Image metadata removed, but file was already missing from storage." });
       } else if (error instanceof StorageError && (error.code === 'storage/retry-limit-exceeded' || error.code.includes('offline'))) {
            errorMessage = "Cannot delete file. Storage offline.";
            setIsOffline(true);
       } else {
           errorMessage = `Deletion failed: ${error instanceof Error ? error.message : String(error)}`;
       }

       // Avoid showing generic error toast if a partial success toast was shown
       if (!(error instanceof StorageError && error.code === 'storage/object-not-found')) {
            toast({
               title: "Deletion Error",
               description: errorMessage,
               variant: "destructive",
            });
       }

    } finally {
      setDeletingId(null); // Reset deleting indicator
    }
  };


  const getDialogTitleId = (imageId: string) => `delete-image-dialog-title-${imageId}`;
  const getDialogDescriptionId = (imageId: string) => `delete-image-dialog-description-${imageId}`;


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Gallery Management</h1>
      <p className="text-muted-foreground">Upload or delete images for the public website gallery. Uses Firestore for metadata and Storage for files.</p>

      {isOffline && (
         <Alert variant="default" className="border-yellow-500 text-yellow-700 dark:border-yellow-600 dark:text-yellow-300 [&>svg]:text-yellow-500 dark:[&>svg]:text-yellow-400">
             <WifiOff className="h-4 w-4"/>
             <AlertTitle>Offline Mode</AlertTitle>
             <AlertDescription>You appear to be offline. Functionality may be limited.</AlertDescription>
         </Alert>
       )}

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload New Image</CardTitle>
          <CardDescription>Select an image file. It will be uploaded to Storage and its info saved to Firestore.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
             <Label htmlFor="gallery-upload" className="sr-only">Choose file</Label>
             <Input id="gallery-upload" type="file" accept="image/*" onChange={handleFileChange} disabled={uploading || isOffline} />
          </div>
           {selectedFile && <p className="text-sm text-muted-foreground">Selected: {selectedFile.name}</p>}
          <Button onClick={handleUpload} disabled={!selectedFile || uploading || isOffline}>
            {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isOffline ? <WifiOff className="mr-2 h-4 w-4" /> : <Upload className="mr-2 h-4 w-4" />}
            {uploading ? 'Uploading...' : isOffline ? 'Offline' : 'Upload Image'}
          </Button>
        </CardContent>
      </Card>

      {/* Image Grid Section - Fetched from Firestore */}
      <Card>
        <CardHeader>
          <CardTitle>Current Gallery Images</CardTitle>
          <CardDescription>Manage existing images stored in Firestore. Hover over an image to delete it.</CardDescription>
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
             <p className="text-center text-muted-foreground p-6">No images in the gallery yet. Upload some!</p>
          ) : (
            <div className="grid grid-cols-gallery gap-4">
              {images.map((imageMeta) => {
                const titleId = getDialogTitleId(imageMeta.id);
                const descriptionId = getDialogDescriptionId(imageMeta.id);
                return (
                  <div key={imageMeta.id} className="relative group border rounded-lg overflow-hidden shadow">
                    <Image
                      src={imageMeta.url} // URL from Firestore document
                      alt={imageMeta.name || "Gallery image"} // Name from Firestore document
                      width={300}
                      height={200}
                      className="object-cover w-full h-full aspect-[3/2]"
                      data-ai-hint="astronomy club gallery"
                      onError={(e) => {
                         console.warn(`Failed to load image: ${imageMeta.url}`);
                         // Optionally replace src with a placeholder on error
                         e.currentTarget.src = 'https://picsum.photos/seed/error/300/200'; // Fallback placeholder
                       }}
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                              variant="destructive"
                              size="icon"
                              disabled={deletingId === imageMeta.id || isOffline}
                              aria-label={`Delete image ${imageMeta.name}`}
                          >
                            {deletingId === imageMeta.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                            <span className="sr-only">Delete Image</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent
                          aria-labelledby={titleId}
                          aria-describedby={descriptionId}
                        >
                          <AlertDialogHeader>
                            <AlertDialogTitle id={titleId}>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription id={descriptionId}>
                              This action cannot be undone. This will permanently delete the image metadata from Firestore and the file from Storage:
                              <span className="font-medium break-all block mt-1"> {imageMeta.name} </span>
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
