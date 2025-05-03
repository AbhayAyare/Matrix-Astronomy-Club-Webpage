
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useFirebase } from '@/context/firebase-provider';
import { doc, getDoc, setDoc, updateDoc, FirestoreError } from 'firebase/firestore';
import { Loader2, WifiOff, Save } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';

const CONTENT_DOC_ID = 'siteContent'; // Single document to store content
const CONTENT_COLLECTION = 'config'; // Collection name

// Updated interface to include all editable fields
interface SiteContent {
  heroTitle: string;
  heroSubtitle: string;
  about: string;
  joinTitle: string;
  joinDescription: string;
  newsletterTitle: string;
  newsletterDescription: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
}

// Default content structure
const defaultContent: SiteContent = {
  heroTitle: 'Welcome to Matrix Astronomy Club',
  heroSubtitle: 'Your gateway to the cosmos. Explore, learn, and connect with fellow space enthusiasts.',
  about: 'Matrix is a passionate community dedicated to exploring the wonders of the universe. We organize stargazing sessions, workshops, and talks for enthusiasts of all levels.',
  joinTitle: 'Become a Member',
  joinDescription: 'Fill out the form below to start your cosmic journey with us.',
  newsletterTitle: 'Subscribe to Our Newsletter',
  newsletterDescription: 'Get the latest news, event announcements, and astronomical insights delivered to your inbox.',
  contactEmail: 'info@matrixastronomy.org',
  contactPhone: '7219690903',
  contactAddress: 'Kolhapur',
};


export default function AdminContentPage() {
  const { db } = useFirebase();
  const { toast } = useToast();
  const [content, setContent] = useState<SiteContent>(defaultContent);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false); // Track offline state
  const [isDirty, setIsDirty] = useState(false); // Track changes

  const contentDocRef = doc(db, CONTENT_COLLECTION, CONTENT_DOC_ID);

  // Fetch content on load
  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      setFetchError(null); // Reset error on fetch
      setIsOffline(false); // Reset offline state
      try {
        const docSnap = await getDoc(contentDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as Partial<SiteContent>; // Use partial in case some fields are missing
           // Merge fetched data with defaults to ensure all fields exist
           setContent({ ...defaultContent, ...data });
        } else {
          console.log("No such document! Creating default content.");
           // Create the document with default content if it doesn't exist
           await setDoc(contentDocRef, defaultContent);
           setContent(defaultContent); // Set state to defaults
        }
        setIsDirty(false); // Reset dirty state after fetch/creation
      } catch (error) {
        console.error("Error fetching content:", error);
        let errorMessage = "Failed to load website content.";
         if (error instanceof FirestoreError && (error.code === 'unavailable' || error.message.includes('offline'))) {
            errorMessage = "Cannot load content. You appear to be offline. Please check your internet connection.";
            setFetchError(errorMessage);
            setIsOffline(true); // Set offline state
         } else {
             // Use the generic error message for other errors
             setFetchError(errorMessage);
         }
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db]); // Rerun if db instance changes

  // Generic handler for input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setContent(prevContent => ({ ...prevContent, [name]: value }));
    setIsDirty(true); // Mark as dirty when changed
  };


  // Single save function for all content
  const handleSaveContent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Use updateDoc to only change fields, or setDoc with merge: true if you prefer
      await updateDoc(contentDocRef, content);
      toast({
        title: "Success",
        description: "Website content updated successfully.",
      });
      setIsDirty(false); // Reset dirty state after successful save
    } catch (error) {
      console.error("Error updating content:", error);
       let errorMessage = "Failed to update website content.";
        if (error instanceof FirestoreError && (error.code === 'unavailable' || error.message.includes('offline'))) {
          errorMessage = "Cannot save. You appear to be offline.";
          setIsOffline(true); // Indicate offline during save attempt
        }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2">Loading Content...</span></div>;
  }

  if (fetchError && !isOffline) { // Show destructive alert only for non-offline errors
     return (
         <div className="space-y-6">
           <h1 className="text-3xl font-bold">Content Management</h1>
           <Alert variant="destructive">
             <AlertCircle className="h-4 w-4" />
             <AlertTitle>Error</AlertTitle>
             <AlertDescription>{fetchError}</AlertDescription>
             <Button onClick={() => window.location.reload()} className="mt-4">Retry</Button>
           </Alert>
         </div>
     );
   }


  return (
     <form onSubmit={handleSaveContent} className="space-y-6">
      <div className="flex items-center justify-between sticky top-0 py-4 bg-background/90 backdrop-blur z-10">
        <div>
          <h1 className="text-3xl font-bold">Content Management</h1>
          <p className="text-muted-foreground">Update the text content displayed on the public website.</p>
        </div>
        <Button type="submit" disabled={saving || !isDirty || isOffline}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4"/>
          {saving ? 'Saving...' : isOffline ? 'Offline - Cannot Save' : 'Save All Changes'}
        </Button>
      </div>

      {/* Offline Warning */}
      {isOffline && (
         <Alert variant="default" className="border-yellow-500 text-yellow-700 dark:border-yellow-600 dark:text-yellow-300 [&>svg]:text-yellow-500 dark:[&>svg]:text-yellow-400">
             <WifiOff className="h-4 w-4"/>
             <AlertTitle>Offline Mode</AlertTitle>
             <AlertDescription>You are currently offline. Content cannot be saved until you reconnect.</AlertDescription>
         </Alert>
       )}

      {/* Display fetch error if offline */}
      {fetchError && isOffline && (
          <Alert variant="default" className="border-yellow-500 text-yellow-700 dark:border-yellow-600 dark:text-yellow-300 [&>svg]:text-yellow-500 dark:[&>svg]:text-yellow-400">
              <AlertCircle className="h-4 w-4"/>
              <AlertTitle>Loading Issue</AlertTitle>
              <AlertDescription>{fetchError}</AlertDescription>
              <Button onClick={() => window.location.reload()} className="mt-4" variant="outline" size="sm">Retry Connection</Button>
          </Alert>
      )}


      {/* Hero Section */}
      <Card>
        <CardHeader>
          <CardTitle>Hero Section</CardTitle>
          <CardDescription>Edit the main title and subtitle shown at the top of the homepage.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="heroTitle">Hero Title</Label>
            <Input
              id="heroTitle"
              name="heroTitle"
              value={content.heroTitle}
              onChange={handleInputChange}
              disabled={saving || isOffline}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="heroSubtitle">Hero Subtitle</Label>
            <Textarea
              id="heroSubtitle"
              name="heroSubtitle"
              value={content.heroSubtitle}
              onChange={handleInputChange}
              rows={3}
              disabled={saving || isOffline}
            />
          </div>
        </CardContent>
      </Card>

      {/* About Matrix Section */}
      <Card>
        <CardHeader>
          <CardTitle>About Matrix Section</CardTitle>
          <CardDescription>Edit the introductory text for the club.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
             <Label htmlFor="about">About Content</Label>
             <Textarea
               id="about"
               name="about"
               placeholder="Enter the 'About Matrix' content here..."
               value={content.about}
               onChange={handleInputChange}
               rows={6}
               disabled={saving || isOffline}
             />
           </div>
        </CardContent>
      </Card>

       {/* Join Section */}
      <Card>
        <CardHeader>
          <CardTitle>Join Section</CardTitle>
          <CardDescription>Edit the title and description for the membership join section.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="joinTitle">Join Title</Label>
            <Input
              id="joinTitle"
              name="joinTitle"
              value={content.joinTitle}
              onChange={handleInputChange}
              disabled={saving || isOffline}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="joinDescription">Join Description</Label>
            <Textarea
              id="joinDescription"
              name="joinDescription"
              value={content.joinDescription}
              onChange={handleInputChange}
              rows={3}
              disabled={saving || isOffline}
            />
          </div>
        </CardContent>
      </Card>

       {/* Newsletter Section */}
      <Card>
        <CardHeader>
          <CardTitle>Newsletter Section</CardTitle>
          <CardDescription>Edit the title and description for the newsletter signup section.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newsletterTitle">Newsletter Title</Label>
            <Input
              id="newsletterTitle"
              name="newsletterTitle"
              value={content.newsletterTitle}
              onChange={handleInputChange}
              disabled={saving || isOffline}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newsletterDescription">Newsletter Description</Label>
            <Textarea
              id="newsletterDescription"
              name="newsletterDescription"
              value={content.newsletterDescription}
              onChange={handleInputChange}
              rows={3}
              disabled={saving || isOffline}
            />
          </div>
        </CardContent>
      </Card>


      {/* Contact Info Section */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>Update the contact details shown on the website.</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="space-y-4">
             <div className="space-y-2">
               <Label htmlFor="contactEmail">Email Address</Label>
               <Input
                 id="contactEmail"
                 name="contactEmail"
                 type="email"
                 placeholder="info@matrixastronomy.org"
                 value={content.contactEmail}
                 onChange={handleInputChange}
                 disabled={saving || isOffline}
               />
             </div>
              <div className="space-y-2">
               <Label htmlFor="contactPhone">Phone Number</Label>
               <Input
                 id="contactPhone"
                 name="contactPhone"
                 type="tel"
                 placeholder="+1 (555) 123-4567"
                 value={content.contactPhone}
                 onChange={handleInputChange}
                 disabled={saving || isOffline}
               />
             </div>
             <div className="space-y-2">
               <Label htmlFor="contactAddress">Address</Label>
               <Textarea
                 id="contactAddress"
                 name="contactAddress"
                 placeholder="Kolhapur"
                 value={content.contactAddress}
                 onChange={handleInputChange}
                 rows={3}
                 disabled={saving || isOffline}
               />
             </div>
          </div>
        </CardContent>
      </Card>

       <div className="flex justify-end py-4">
          <Button type="submit" disabled={saving || !isDirty || isOffline}>
           {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
           <Save className="mr-2 h-4 w-4"/>
           {saving ? 'Saving...' : isOffline ? 'Offline - Cannot Save' : 'Save All Changes'}
         </Button>
       </div>
    </form>
  );
}
