// lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

// Create a new QueryClient instance
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Global default options for all queries
            staleTime: 1000 * 60 * 2, // Data is considered "fresh" for 2 minutes. After this, it's "stale".
            refetchOnWindowFocus: true, // Automatically refetch data when the browser window regains focus.
            retry: 1, // Retry failed data fetches once before showing an error.
        },
        mutations: {
            // Global default options for all mutations (data changes)
            // We'll configure these on a case-by-case basis.
        },
    },
});

export default queryClient;