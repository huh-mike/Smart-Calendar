// lib/api/events.ts
import {createClient} from '@/utils/supabase/client';
import { Event } from '@/lib/types/calendar';

// --- FETCH (GET) ---
// Assumes RLS is in place to filter events for the authenticated user.
export const fetchEvents = async (): Promise<Event[]> => {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('events')
        .select() // Supabase applies RLS policies here based on the authenticated user
        .order('start_time', { ascending: true });

    if (error) {
        console.error('Supabase error fetching events:', error);
        // It's good practice to check the error type/code for more specific handling
        // For example, if RLS prevents access, the error might indicate that.
        throw new Error(error.message);
    }
    return data || [];
};

// --- CREATE (POST) ---
// For INSERT, RLS policies often check if auth.uid() matches the user_id being inserted.
// The eventData should include user_id, typically set to the current user's ID before calling this.
export const addEvent = async (
    eventData: Omit<Event, 'id' | 'created_at' | 'updated_at'>
): Promise<Event> => {
    const supabase = createClient();
    // Ensure eventData.user_id is correctly set to the authenticated user's ID
    // by the calling code (e.g., in useEventForm) before this function is invoked.
    // RLS policy for INSERT will then validate this.

    const { data, error } = await supabase
        .from('events')
        .insert([eventData]) // RLS policy for INSERT is applied here
        .select()
        .single();

    if (error) {
        console.error('Supabase error adding event:', error);
        throw new Error(error.message);
    }
    if (!data) {
        throw new Error('No data returned after adding event.');
    }
    return data;
};

// --- UPDATE (PUT/PATCH) ---
// RLS policies for UPDATE typically check if auth.uid() matches the user_id of the row being updated.
export const updateEvent = async (
    eventDataToUpdate: Partial<Omit<Event, 'created_at' | 'user_id'>> & { id: string }
): Promise<Event> => {
    const supabase = createClient();
    const { id, ...updatePayload } = eventDataToUpdate;

    // RLS policy for UPDATE will ensure the user can only update their own events.
    // The .eq('id', id) targets the specific event.
    const payloadWithTimestamp = {
        ...updatePayload,
        updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
        .from('events')
        .update(payloadWithTimestamp)
        .eq('id', id) // RLS policy also applies here
        .select()
        .single();

    if (error) {
        console.error('Supabase error updating event:', error);
        throw new Error(error.message);
    }
    if (!data) {
        throw new Error('No data returned after updating event.');
    }
    return data;
};

// --- DELETE ---
// RLS policies for DELETE typically check if auth.uid() matches the user_id of the row being deleted.
export const deleteEvent = async (eventId: string): Promise<void> => {
    const supabase = createClient();

    // RLS policy for DELETE ensures user can only delete their own events.
    const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId); // RLS policy also applies here

    if (error) {
        console.error('Supabase error deleting event:', error);
        throw new Error(error.message);
    }
};