import { create } from 'zustand';

interface UserState {
    userId: string | null;
    isLoading: boolean;
    error: string | null;

    setUserId: (userId: string | null) => void; // Added setter
    setLoading: (isLoading: boolean) => void; // Added setter
    setError: (error: string | null) => void; // Added setter
    clearUser: () => void;
}

export const useUserStore = create<UserState>((set) => ({
    userId: null,
    isLoading: false, // Default to false; useAuth will manage this
    error: null,

    // Setter for userId
    setUserId: (userId: string | null) => {
        set({ userId });
        // Optionally, you can also manage loading/error states here if needed when userId is set directly
        // For example, if userId is set, imply loading is false and error is null
        // set({ userId, isLoading: false, error: null });
    },

    // Setter for isLoading state
    setLoading: (isLoading: boolean) => {
        set({ isLoading });
    },

    // Setter for error state
    setError: (error: string | null) => {
        set({ error, isLoading: false }); // If error occurs, loading should typically be false
        if (error) {
            set({ userId: null }); // Clear userId if there's an error
        }
    },

    // clearUser remains the same, it's used by useAuth on SIGNED_OUT
    clearUser: () => {
        set({ userId: null, isLoading: false, error: null });
        console.log('User cleared in Zustand Store');
    },

    // fetchUserId is removed as its logic is now handled by the useAuth hook using TanStack Query.
    // The useAuth hook will call setUserId, setLoading, and setError to keep this store in sync.
}));

