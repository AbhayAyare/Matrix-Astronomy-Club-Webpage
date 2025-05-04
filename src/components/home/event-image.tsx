
'use client';

import Image from 'next/image';

interface EventImageProps {
  src: string | null | undefined;
  alt: string;
  eventId: string; // To generate a fallback seed
  priority?: boolean;
}

export function EventImage({ src, alt, eventId, priority }: EventImageProps) {
  const fallbackSrc = `https://picsum.photos/seed/${eventId}/400/250`;
  const imageUrl = src || fallbackSrc;

  return (
    <Image
      src={imageUrl}
      alt={alt}
      fill
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      className="object-cover transition-transform duration-300 group-hover:scale-105"
      data-ai-hint="astronomy club event"
      priority={priority}
      onError={(e) => {
        console.warn(`[Event Image] Failed to load: ${src}. Falling back to placeholder.`);
         // Check if currentTarget exists and has a src property before modifying
        if (e.currentTarget && typeof e.currentTarget.src === 'string') {
            e.currentTarget.src = fallbackSrc; // Fallback placeholder
        }
        e.currentTarget.onerror = null; // Prevent infinite loop if fallback also fails
      }}
      unoptimized={!imageUrl.startsWith('/')} // Disable optimization for external URLs or placeholders
    />
  );
}
