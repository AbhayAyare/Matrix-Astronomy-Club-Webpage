
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { FirestoreError } from 'firebase/firestore';

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

  // Ensure error.message is a string, default to empty string if not
  const message = String(error?.message ?? '').toLowerCase();
  const code = error?.code; // For FirestoreError, or other error objects with a 'code'

  // Check for specific Firestore error codes related to network/offline issues
  if (error instanceof FirestoreError || (typeof code === 'string')) {
    const offlineCodes: string[] = [
        'unavailable',        // Common code when the backend is unreachable
        'cancelled',          // Can sometimes indicate network issues or client-side cancellation
        'unknown',            // Can sometimes wrap network issues
        'deadline-exceeded',  // Network timeout
    ];
    if (code && offlineCodes.includes(String(code).toLowerCase())) {
        console.debug(`[isOfflineError] Detected Firestore offline code: ${code}`);
        return true;
    }
    // Explicitly check for permission denied as NOT an offline error
    if (code && String(code).toLowerCase() === 'permission-denied') {
        console.debug('[isOfflineError] Detected Firestore permission-denied, treating as NOT offline.');
        return false;
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
    'connection lost',
  ];

  if (offlineKeywords.some(keyword => message.includes(keyword))) {
    // Ensure it's not a permission denied error masking as a network issue
    if ((error instanceof FirestoreError || (typeof code === 'string')) && String(code).toLowerCase() === 'permission-denied') {
        return false; // Prioritize permission denied over keywords
    }
    console.debug(`[isOfflineError] Detected offline keyword in message: "${message}"`);
    return true;
  }

  // If none of the above conditions are met, assume it's not an offline error
  return false;
}

/**
 * Helper to format error reasons from Promise.allSettled or other error objects.
 * @param reason The error reason to format.
 * @returns A string representation of the error.
 */
export function formatErrorReason(reason: any): string {
  if (reason instanceof Error) {
    return reason.message;
  }
  if (typeof reason === 'string') {
    return reason;
  }
  // Attempt to stringify, but handle complex objects or undefined/null safely
  try {
    if (reason === null || reason === undefined) {
      return 'Unknown error (null or undefined reason)';
    }
    const str = JSON.stringify(reason);
    // Truncate long strings to prevent overly verbose error messages
    return str.length > 200 ? str.substring(0, 197) + "..." : str;
  } catch {
    // Fallback if JSON.stringify fails (e.g., circular references)
    return String(reason);
  }
}
