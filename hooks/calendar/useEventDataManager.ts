import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchEvents, addEvent, updateEvent, deleteEvent } from '@/lib/api/events'
import { Event } from '@/lib/types/calendar'

export function useEventDataManager(userId: string | null) {
    const queryClient = useQueryClient();

    const {
        data: events = [], // Default to empty array if data is undefined
        isLoading: isLoadingEvents,
        isFetching: isFetchingEvents, // Different from isLoading, true during background refetches
        isError: isErrorEvents,
        error: eventsError,
        refetch: refetchEvents, // Function to manually refetch events
    } = useQuery<Event[], Error>({
        // Query key: Identifies this specific query.
        // Include factors that influence the query, e.g., filters, userId if not handled solely by RLS.
        queryKey: ['events', {user: userId}], // Example: Include userId if fetchEvents needs it or RLS depends on it implicitly
        queryFn: () => fetchEvents(), // The API function to call
        enabled: !!userId, // Only run the query if the userId is available (prevents fetching before login)
        staleTime: 1 * 60 * 1000, // Data is considered fresh for 1 minute
        gcTime: 5 * 60 * 1000,   // Keep data in cache for 5 minutes
    });

    // --- Mutation for Adding Event ---
    const addEventMutation = useMutation<
        Event, // Type of data returned by the mutation function on success
        Error, // Type of error thrown on failure
        Omit<Event, 'id' | 'created_at' | 'updated_at'> // Type of variables passed to the mutation function
    >({
        mutationFn: addEvent, // The API function for adding an event
        onSuccess: (newEventData) => {
            // When the mutation is successful, invalidate the 'events' query cache.
            // This tells TanStack Query that the data for 'events' is stale and needs refetching.
            queryClient.invalidateQueries({queryKey: ['events']});

            // Optional: Optimistic update (more complex) - Manually add the new event
            // to the cache immediately for a faster UI update, before refetch completes.
            // queryClient.setQueryData(['events', { user: userId }], (oldData: Event[] | undefined) =>
            //   oldData ? [...oldData, newEventData] : [newEventData]
            // );
        },
        onError: (error) => {
            // Handle mutation errors (e.g., show a notification)
            console.error("Error adding event:", error);
            // You might want to trigger a toast notification here
        },
    });

    // --- Mutation for Updating Event ---
    const updateEventMutation = useMutation<
        Event,
        Error,
        Partial<Omit<Event, 'created_at' | 'user_id'>> & { id: string } // Requires ID and partial event data
    >({
        mutationFn: updateEvent,
        onSuccess: (updatedEventData) => {
            // Invalidate the cache to refetch updated data
            queryClient.invalidateQueries({queryKey: ['events']});

            // Optional: Optimistic update
            // queryClient.setQueryData(['events', { user: userId }], (oldData: Event[] | undefined) =>
            //   oldData?.map(event => event.id === updatedEventData.id ? updatedEventData : event)
            // );
        },
        onError: (error, variables) => {
            console.error(`Error updating event ${variables.id}:`, error);
        },
    });

    // --- Mutation for Deleting Event ---
    const deleteEventMutation = useMutation<
        void, // Delete function returns void on success
        Error,
        string // Takes the event ID (string) as input
    >({
        mutationFn: deleteEvent,
        onSuccess: (data, eventId) => { // `variables` (eventId here) is the second argument
            // Invalidate the cache
            queryClient.invalidateQueries({queryKey: ['events']});

            // Optional: Optimistic update - Remove the event immediately
            // queryClient.setQueryData(['events', { user: userId }], (oldData: Event[] | undefined) =>
            //   oldData?.filter(event => event.id !== eventId)
            // );
        },
        onError: (error, eventId) => {
            console.error(`Error deleting event ${eventId}:`, error);
        },
    });

    return {
        // Event Data & State
        events,
        isLoadingEvents, // True only on initial load when no cached data exists
        isFetchingEvents, // True on initial load AND background refetches
        isErrorEvents,
        eventsError,
        refetchEvents,

        // Mutations (functions to call, and their states)
        addEvent: addEventMutation.mutate, // The function to call to trigger the mutation
        isAddingEvent: addEventMutation.isPending, // True while the mutation is running
        isAddEventError: addEventMutation.isError,
        addEventError: addEventMutation.error,

        updateEvent: updateEventMutation.mutate,
        isUpdatingEvent: updateEventMutation.isPending,
        isUpdateEventError: updateEventMutation.isError,
        updateEventError: updateEventMutation.error,

        deleteEvent: deleteEventMutation.mutate,
        isDeletingEvent: deleteEventMutation.isPending,
        isDeleteEventError: deleteEventMutation.isError,
        deleteEventError: deleteEventMutation.error,
    };
}