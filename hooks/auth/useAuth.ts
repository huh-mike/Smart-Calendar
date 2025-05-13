import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { useUserStore } from "@/stores/userStore"

import { createClient } from '@/utils/supabase/client';
import type { User } from "@supabase/supabase-js"

interface AuthData {
    user: User | null;
    userId: string | null;
}

const fetchUser = async (): Promise<AuthData> => {
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
        console.error("Error fetching Supabase user:", userError.message);
        // Throwing will put the TanStack Query in an 'error' state
        throw userError;
    }

    return { user, userId: user?.id ?? null };
};

/**
 * @description Custom hook to manage user authentication state using TanStack Query
 * and synchronize the user ID with the Zustand store.
 * @returns {object} - Contains user object, userId, session, loading state, error state, and refetch function.
 */
export function useAuth() {
    const queryClient = useQueryClient()

    const storeSetUserId = useUserStore((state) => state.setUserId);
    const storeSetLoading = useUserStore((state) => state.setLoading);
    const storeSetError = useUserStore((state) => state.setError);
    const storeClearUser = useUserStore((state) => state.clearUser);

    const {
        data: authData, // Contains { user, userId }
        isLoading: isLoadingUser, // TanStack Query's loading state for the initial fetch
        isError: isErrorUser,     // TanStack Query's error state
        error: userError,         // The actual error object from TanStack Query
        isFetching: isFetchingUser, // True if fetching, including background refetches
        refetch: refetchUserSession, // Function to manually refetch user
    } = useQuery<AuthData, Error>({
        queryKey: ['authUser'], // Unique key for the user query
        queryFn: fetchUser,
        staleTime: 5 * 60 * 1000, // Cache user data for 5 minutes
        gcTime: 10 * 60 * 1000, // Keep data in cache for 10 minutes
        retry: 1, // Retry once on error
        refetchOnWindowFocus: true, // Refetch when window regains focus
    });

    useEffect(() => {
        if (isLoadingUser || isFetchingUser) {
            storeSetLoading(true);
        } else if (isErrorUser && userError) {
            storeSetError(userError.message);
            storeSetUserId(null); // Clear userId in store on error
            storeSetLoading(false);
        } else if (authData) {
            storeSetUserId(authData.userId);
            storeSetError(null); // Zustand userError
            storeSetLoading(false);
        }
    }, [
        authData,
        isLoadingUser,
        isFetchingUser,
        isErrorUser,
        userError, // TanStack userError, not from Zustand
        storeSetUserId,
        storeSetLoading,
        storeSetError,
    ]);

    useEffect(() => {
        const supabase = createClient();
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                console.log('Supabase auth state changed:', event, session);
                // Invalidate the 'authUser' query to trigger a refetch by TanStack Query
                queryClient.invalidateQueries({ queryKey: ['authUser'] });

                // If signed out, also immediately clear user in Zustand for faster UI response
                if (event === 'SIGNED_OUT') {
                    storeClearUser(); // Use your existing clearUser action
                }
            }
        );

        // Cleanup subscription on component unmount
        return () => {
            subscription?.unsubscribe();
        };
    }, [queryClient, storeClearUser]); // Dependencies for the effect

    return {
        user: authData?.user ?? null,
        userId: authData?.userId ?? null,
        isLoading: isLoadingUser || isFetchingUser, // Combined loading state for UI
        isError: isErrorUser,
        error: userError,
        refetchUser: refetchUserSession,
    };
}


