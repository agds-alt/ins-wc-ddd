/**
 * tRPC Client Setup
 * React Query + tRPC for frontend
 */

import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@/server/root';
import superjson from 'superjson';

/**
 * tRPC React hooks
 * Use this in components
 */
export const trpc = createTRPCReact<AppRouter>();

/**
 * Get base URL for tRPC API
 */
function getBaseUrl() {
  if (typeof window !== 'undefined') {
    // Browser should use relative path
    return '';
  }

  // Server-side: use full URL
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // Localhost fallback
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

/**
 * Create tRPC client
 * Used in TRPCProvider
 */
export function createClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${getBaseUrl()}/api/trpc`,
        transformer: superjson,

        // Include credentials (cookies) in requests
        fetch(url, options) {
          return fetch(url, {
            ...options,
            credentials: 'include',
          });
        },
      }),
    ],
  });
}

/**
 * Vanilla tRPC client (for server-side or non-React usage)
 */
export const vanillaClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
    }),
  ],
});
