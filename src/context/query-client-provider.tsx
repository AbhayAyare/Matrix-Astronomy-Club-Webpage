'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

export function QueryClientProviderWrapper({ children }: { children: React.ReactNode }) {
  // Use useState to ensure QueryClient is only created once per component instance
  const [queryClient] = useState(() => new QueryClient({
     defaultOptions: {
       queries: {
         // Optional: configure default query options
         staleTime: 1000 * 60 * 5, // 5 minutes
         refetchOnWindowFocus: false, // Prevent refetching on window focus
       },
     },
   }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
