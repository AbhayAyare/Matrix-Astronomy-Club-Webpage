
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { SiteContent, defaultSiteContent } from '@/services/content';
import { HomePageClient } from '@/components/home/home-page-client';
import { fetchSiteContentData, fetchUpcomingEventsData, fetchGalleryImagesData, Event, GalleryImageMetadata } from '@/services/page-data'; // Import fetch functions
import { formatErrorReason } from '@/lib/utils'; // Assuming formatErrorReason is in utils

// This component remains a Server Component to fetch initial data at build time.
export default async function Home() {
  console.log("[Home Page - Server Component] Starting build-time data fetch...");

  const [
    contentResult,
    eventsResult,
    galleryResult,
  ] = await Promise.allSettled([
    fetchSiteContentData(),
    fetchUpcomingEventsData(),
    fetchGalleryImagesData(),
  ]);

  const siteContent: SiteContent = contentResult.status === 'fulfilled'
    ? contentResult.value.content
    : defaultSiteContent;
  const siteContentError: string | null = contentResult.status === 'fulfilled'
    ? contentResult.value.error
    : `Website Content: Fetch failed: ${formatErrorReason(contentResult.reason)}`;

  const upcomingEvents: Event[] = eventsResult.status === 'fulfilled'
    ? eventsResult.value.data
    : [];
  const eventsError: string | null = eventsResult.status === 'fulfilled'
    ? eventsResult.value.error
    : `Events: Fetch failed: ${formatErrorReason(eventsResult.reason)}`;

  const galleryImages: GalleryImageMetadata[] = galleryResult.status === 'fulfilled'
    ? galleryResult.value.data
    : [];
  const galleryError: string | null = galleryResult.status === 'fulfilled'
    ? galleryResult.value.error
    : `Gallery: Fetch failed: ${formatErrorReason(galleryResult.reason)}`;

  const allErrorsFromBuild = [siteContentError, eventsError, galleryError].filter(Boolean) as string[];

  console.log(`[Home Page - Server Component] Build-time data fetch completed.`);
  if (allErrorsFromBuild.length > 0) {
    console.warn(`[Home Page - Server Component] Build-time Fetch Errors:`, allErrorsFromBuild);
  }

  return (
    <HomePageClient
      initialSiteContent={siteContent}
      initialUpcomingEvents={upcomingEvents}
      initialGalleryImages={galleryImages}
      initialAllErrors={allErrorsFromBuild}
    />
  );
}
