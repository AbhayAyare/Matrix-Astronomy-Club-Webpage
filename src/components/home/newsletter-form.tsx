
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send } from 'lucide-react';
import { addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useFirebase } from '@/context/firebase-provider';

export function NewsletterForm() {
    const { db } = useFirebase();
    const { toast } = useToast();
    const [email, setEmail] = useState('');
    const [subscribing, setSubscribing] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubscribing(true);

        // Basic email validation (optional but recommended)
        if (!email || !/\S+@\S+\.\S+/.test(email)) {
            toast({
                title: "Invalid Email",
                description: "Please enter a valid email address.",
                variant: "destructive",
            });
            setSubscribing(false);
            return;
        }
        if (!db) {
            toast({
                title: "Invalid Email",
                description: "Please enter a valid email address.",
                variant: "destructive",
            });
            setSubscribing(false);
            return;
        }


        try {
            await addDoc(collection(db, 'newsletterSubscribers'), {
                email,
                subscribedAt: serverTimestamp() as Timestamp, // Add timestamp
            });

            toast({
                title: "Subscribed!",
                description: "You've been added to the newsletter.",
            });

            // Reset form
            setEmail('');
        } catch (error) {
            console.error("Error subscribing to newsletter:", error);
            toast({
                title: "Subscription Failed",
                description: "Something went wrong. Please try again.",
                variant: "destructive",
            });
        } finally {
            setSubscribing(false);
        }
    };


    return (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
            <Input
                type="email"
                placeholder="Enter your email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={subscribing}
                className="flex-grow transition-colors duration-200 focus:border-accent"
            />
            <Button type="submit" variant="default" className="transform hover:scale-105 transition-transform duration-200 ease-in-out" disabled={subscribing}>
                {subscribing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                {subscribing ? 'Subscribing...' : 'Subscribe'}
            </Button>
        </form>
    );
}
