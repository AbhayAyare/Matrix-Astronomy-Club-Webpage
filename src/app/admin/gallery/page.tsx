'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useFirebase } from '@/context/firebase-provider';
import { ref, uploadBytes, getDownloadURL, listAll, deleteObject, StorageReference } from 'firebase/storage';
import { Loader2, Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

const GALLERY_FOLDER = 'gallery';

interface GalleryImage {
  url: string;
  ref: StorageReference; // Store reference for deletion
  name: string;
}

export default function AdminGalleryPage() {
  const { storage } = useFirebase();
  const { toast } = useToast();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [deletingRef, setDeletingRef] = useState<StorageReference | null>(null);


  const galleryListRef = ref(storage, GALLERY_FOLDER);

  // Fetch images on load
  const fetchImages = async () => {
    setLoading(true);
    try {
      const res = await listAll(galleryListRef);
      const fetchedImagesPromises = res.items.map(async (itemRef) => {
        const url = await getDownloadURL(itemRef);
        return { url, ref: itemRef, name: itemRef.name };
      });
      const fetchedImages = await Promise.all(fetchedImagesPromises);
      // Sort images if needed, e.g., by name
      fetchedImages.sort((a, b) => a.name.localeCompare(b.name));
      setImages(fetchedImages);
    } catch (error) {
      console.error("Error fetching gallery images:", error);
      toast({
        title: "Error",
        description: "Failed to load gallery images.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storage]); // Dependency on storage instance

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({ title: "No File", description: "Please select an image file to upload.", variant: "destructive" });
      return;
    }
    setUploading(true);
    const imageRef = ref(storage, `${GALLERY_FOLDER}/${Date.now()}_${selectedFile.name}`); // Unique name

    try {
      const snapshot = await uploadBytes(imageRef, selectedFile);
      const url = await getDownloadURL(snapshot.ref);
       const newImage : GalleryImage = { url, ref: snapshot.ref, name: snapshot.ref.name };
       setImages(prevImages => [...prevImages, newImage].sort((a, b) => a.name.localeCompare(b.name))); // Add and sort
      toast({ title: "Success", description: "Image uploaded successfully." });
      setSelectedFile(null); // Reset file input visually (need to clear the input value itself)
       const fileInput = document.getElementById('gallery-upload') as HTMLInputElement;
        if(fileInput) fileInput.value = '';

    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Error",
        description: "Failed to upload image.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageRef: StorageReference) => {
    setDeletingRef(imageRef); // Indicate which image is being deleted
    try {
      await deleteObject(imageRef);
      setImages(images.filter(img => img.ref.fullPath !== imageRef.fullPath));
      toast({ title: "Success", description: "Image deleted successfully." });
    } catch (error) {
      console.error("Error deleting image:", error);
      toast({
        title: "Error",
        description: "Failed to delete image.",
        variant: "destructive",
      });
    } finally {
      setDeletingRef(null); // Reset deleting indicator
    }
  };

  // Unique IDs for Alert Dialog Title and Description
  const alertDialogTitleId = "delete-image-dialog-title";
  const alertDialogDescriptionId = "delete-image-dialog-description";

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Gallery Management</h1>
      <p className="text-muted-foreground">Upload or delete images for the public website gallery.</p>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload New Image</CardTitle>
          <CardDescription>Select an image file to add to the gallery.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
             <Label htmlFor="gallery-upload" className="sr-only">Choose file</Label>
             <Input id="gallery-upload" type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} />
          </div>
           {selectedFile && <p className="text-sm text-muted-foreground">Selected: {selectedFile.name}</p>}
          <Button onClick={handleUpload} disabled={!selectedFile || uploading}>
            {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {uploading ? 'Uploading...' : <><Upload className="mr-2 h-4 w-4" /> Upload Image</>}
          </Button>
        </CardContent>
      </Card>

      {/* Image Grid Section */}
      <Card>
        <CardHeader>
          <CardTitle>Current Gallery Images</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2">Loading Images...</span></div>
          ) : images.length === 0 ? (
             <p className="text-center text-muted-foreground p-6">No images in the gallery yet. Upload some!</p>
          ) : (
            <div className="grid grid-cols-gallery gap-4">
              {images.map((image) => (
                <div key={image.url} className="relative group border rounded-lg overflow-hidden shadow">
                  <Image
                    src={image.url}
                    alt={image.name || "Gallery image"}
                    width={300}
                    height={200}
                    className="object-cover w-full h-full aspect-[3/2]"
                    data-ai-hint="astronomy club gallery" // Generic hint
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                     <AlertDialog>
                      <AlertDialogTrigger asChild>
                         <Button
                            variant="destructive"
                            size="icon"
                            disabled={deletingRef?.fullPath === image.ref.fullPath} // Disable button while this specific image is deleting
                         >
                           {deletingRef?.fullPath === image.ref.fullPath ? (
                             <Loader2 className="h-4 w-4 animate-spin" />
                           ) : (
                             <Trash2 className="h-4 w-4" />
                           )}
                          <span className="sr-only">Delete Image</span>
                         </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent
                        aria-labelledby={alertDialogTitleId}
                        aria-describedby={alertDialogDescriptionId}
                      >
                        <AlertDialogHeader>
                          <AlertDialogTitle id={alertDialogTitleId}>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription id={alertDialogDescriptionId}>
                            This action cannot be undone. This will permanently delete the image
                            <span className="font-medium break-all"> {image.name} </span>
                            from the gallery.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(image.ref)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Yes, delete it
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
