
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { FirestoreError } from 'firebase/firestore'; // Ensure FirestoreError is imported

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper function to check for offline errors (more robust check)
export function isOfflineError(error: any): boolean {
  const message = String(error?.message ?? '').toLowerCase();
  if (error instanceof FirestoreError) {
    // Specific Firestore codes indicating offline or network issues
    return error.code === 'unavailable' || error.code === 'cancelled' || // Cancelled can sometimes indicate network issues
           message.includes('offline') ||
           message.includes('failed to get document because the client is offline') ||
           message.includes('could not reach cloud firestore backend') ||
           message.includes('network'); // Broader check for network-related messages
  }
  // Check generic Error messages as well
  return error instanceof Error && (
      message.includes('network error') ||
      message.includes('client is offline') ||
      message.includes('failed to fetch') || // Browser fetch error
      message.includes('could not reach cloud firestore backend')
  );
}
