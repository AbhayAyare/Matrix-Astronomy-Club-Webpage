
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { FirestoreError } from 'firebase/firestore'; // Ensure FirestoreError is imported

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Checks if an error object likely represents an offline/network condition.
 * @param error The error object to check.
 * @returns True if the error suggests an offline state, false otherwise.
 */
export function isOfflineError(error: any): boolean {
  if (!error) {
    return false;
  }

  const message = String(error?.message ?? '').toLowerCase();

  // Check for specific Firestore error codes related to network/offline issues
  if (error instanceof FirestoreError) {
    const offlineCodes: string[] = [
        'unavailable',        // Common code when the backend is unreachable
        'cancelled',          // Can sometimes indicate network issues or client-side cancellation
        'unknown',            // Can sometimes wrap network issues
        'deadline-exceeded',  // Network timeout
        'resource-exhausted', // Less common, but can relate to network limits
        // Add other codes if observed in logs related to network issues
    ];
    if (offlineCodes.includes(error.code)) {
        console.debug(`[isOfflineError] Detected Firestore offline code: ${error.code}`);
        return true;
    }
  }

  // Check for common network-related strings in the error message
  const offlineKeywords: string[] = [
    'offline',
    'network error',
    'connection failed',
    'could not reach',
    'failed to fetch', // Browser's generic fetch error
    'client is offline',
    'internet connection',
    'network request failed',
  ];

  if (offlineKeywords.some(keyword => message.includes(keyword))) {
    console.debug(`[isOfflineError] Detected offline keyword in message: "${message}"`);
    return true;
  }

  // If none of the above conditions are met, assume it's not an offline error
  return false;
}
