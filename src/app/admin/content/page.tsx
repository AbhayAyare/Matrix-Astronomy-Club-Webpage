'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useFirebase } from '@/context/firebase-provider';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

const CONTENT_DOC_ID = 'siteContent'; // Single document to store content
const CONTENT_COLLECTION = 'config'; // Collection name

interface SiteContent {
  about: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
}

export default function AdminContentPage() {
  const { db } = useFirebase();
  const { toast } = useToast();
  const [aboutContent, setAboutContent] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactAddress, setContactAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingAbout, setSavingAbout] = useState(false);
  const [savingContact, setSavingContact] = useState(false);

  const contentDocRef = doc(db, CONTENT_COLLECTION, CONTENT_DOC_ID);

  // Fetch content on load
  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      try {
        const docSnap = await getDoc(contentDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as SiteContent;
          setAboutContent(data.about || '');
          setContactEmail(data.contactEmail || '');
          setContactPhone(data.contactPhone || '');
          setContactAddress(data.contactAddress || '');
        } else {
          console.log("No such document! Creating default content.");
           // Optional: Create a default document if it doesn't exist
           await setDoc(contentDocRef, {
             about: 'Default about content.',
             contactEmail: 'default@example.com',
             contactPhone: 'N/A',
             contactAddress: 'N/A',
           });
        }
      } catch (error) {
        console.error("Error fetching content:", error);
        toast({
          title: "Error",
          description: "Failed to load website content.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db]); // Add contentDocRef if needed, but Firestore refs are stable

  const handleSaveAbout = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAbout(true);
    try {
      await updateDoc(contentDocRef, { about: aboutContent });
      toast({
        title: "Success",
        description: "About section updated successfully.",
      });
    } catch (error) {
      console.error("Error updating about content:", error);
      toast({
        title: "Error",
        description: "Failed to update About section.",
        variant: "destructive",
      });
    } finally {
      setSavingAbout(false);
    }
  };

  const handleSaveContact = async (e: React.FormEvent) => {
     e.preventDefault();
     setSavingContact(true);
     try {
       await updateDoc(contentDocRef, {
         contactEmail: contactEmail,
         contactPhone: contactPhone,
         contactAddress: contactAddress,
       });
       toast({
         title: "Success",
         description: "Contact information updated successfully.",
       });
     } catch (error) {
       console.error("Error updating contact info:", error);
       toast({
         title: "Error",
         description: "Failed to update contact information.",
         variant: "destructive",
       });
     } finally {
       setSavingContact(false);
     }
   };

  if (loading) {
    return <div className="flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2">Loading Content...</span></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Content Management</h1>
      <p className="text-muted-foreground">Update the text content displayed on the public website.</p>

      {/* About Matrix Section */}
      <Card>
        <CardHeader>
          <CardTitle>About Matrix Section</CardTitle>
          <CardDescription>Edit the introductory text for the club.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveAbout} className="space-y-4">
            <Textarea
              placeholder="Enter the 'About Matrix' content here..."
              value={aboutContent}
              onChange={(e) => setAboutContent(e.target.value)}
              rows={6}
              disabled={savingAbout}
            />
            <Button type="submit" disabled={savingAbout}>
              {savingAbout && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {savingAbout ? 'Saving...' : 'Save About Section'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Contact Info Section */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>Update the contact details shown on the website.</CardDescription>
        </CardHeader>
        <CardContent>
           <form onSubmit={handleSaveContact} className="space-y-4">
             <div className="space-y-2">
               <Label htmlFor="contact-email">Email Address</Label>
               <Input
                 id="contact-email"
                 type="email"
                 placeholder="info@matrixastronomy.org"
                 value={contactEmail}
                 onChange={(e) => setContactEmail(e.target.value)}
                 disabled={savingContact}
               />
             </div>
              <div className="space-y-2">
               <Label htmlFor="contact-phone">Phone Number</Label>
               <Input
                 id="contact-phone"
                 type="tel"
                 placeholder="+1 (555) 123-4567"
                 value={contactPhone}
                 onChange={(e) => setContactPhone(e.target.value)}
                 disabled={savingContact}
               />
             </div>
             <div className="space-y-2">
               <Label htmlFor="contact-address">Address</Label>
               <Textarea
                 id="contact-address"
                 placeholder="123 Cosmos Avenue, Starlight City, ST 98765"
                 value={contactAddress}
                 onChange={(e) => setContactAddress(e.target.value)}
                 rows={3}
                 disabled={savingContact}
               />
             </div>
            <Button type="submit" disabled={savingContact}>
              {savingContact && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {savingContact ? 'Saving...' : 'Save Contact Info'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
