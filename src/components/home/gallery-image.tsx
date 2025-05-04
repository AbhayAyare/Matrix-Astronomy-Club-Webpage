
'use client';

import Image from 'next/image';

interface GalleryImageProps {
  src: string | null | undefined;
  alt: string;
  imageId: string; // To generate a fallback seed
  loading?: 'eager' | 'lazy';
}

export function GalleryImage({ src, alt, imageId, loading }: GalleryImageProps) {
  const fallbackSrc = `https://picsum.photos/seed/${imageId}/300/200`;
  const imageUrl = src || fallbackSrc;

  return (
    <Image
      src={imageUrl}
      alt={alt || `Gallery image ${imageId}`}
      fill
      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 250px"
      className="object-cover transform group-hover:scale-105 transition-transform duration-300 ease-in-out"
      data-ai-hint="astronomy club gallery space"
      loading={loading}
      onError={(e) => {
        console.warn(`[Gallery Image] Failed to load: ${src}. Falling back to placeholder.`);
        e.currentTarget.src = fallbackSrc; // Fallback placeholder
        e.currentTarget.onerror = null; // Prevent infinite loop if fallback also fails
      }}
      unoptimized={!imageUrl.startsWith('/')} // Disable optimization for external URLs or placeholders
    />
  );
}
