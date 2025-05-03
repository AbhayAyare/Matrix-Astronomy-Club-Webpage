
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react';
import { addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useFirebase } from '@/context/firebase-provider';

export function JoinForm() {
    const { db } = useFirebase();
    const { toast } = useToast();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [interest, setInterest] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            await addDoc(collection(db, 'members'), {
                name,
                email,
                interest,
                joinedAt: serverTimestamp() as Timestamp, // Add timestamp
            });

            toast({
                title: "Application Submitted!",
                description: "Thanks for joining! We'll be in touch soon.",
            });

            // Reset form
            setName('');
            setEmail('');
            setInterest('');
        } catch (error) {
            console.error("Error adding member:", error);
            toast({
                title: "Submission Failed",
                description: "Something went wrong. Please try again later.",
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input
                placeholder="Full Name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={submitting}
                className="transition-colors duration-200 focus:border-accent"
            />
            <Input
                type="email"
                placeholder="Email Address"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
                className="transition-colors duration-200 focus:border-accent"
            />
            <Textarea
                placeholder="Tell us a bit about your interest in astronomy (optional)"
                value={interest}
                onChange={(e) => setInterest(e.target.value)}
                disabled={submitting}
                className="transition-colors duration-200 focus:border-accent"
            />
            <Button type="submit" className="w-full transform hover:scale-[1.02] transition-transform duration-200 ease-in-out" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {submitting ? 'Submitting...' : 'Submit Application'}
            </Button>
        </form>
    );
}
