// lib/api/events.ts
import {createClient} from '@/utils/supabase/client';
import { Event } from '@/lib/types/calendar';

// --- FETCH (GET) ---
export const fetchEvents = async (): Promise<Event[]> => {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
        .from('events')
        .select()
        .order('start_time', { ascending: true }); // Order by start time
    if (error) {
        console.error('Supabase error fetching events:', error);
        throw new Error(error.message); // TanStack Query expects an error to be thrown on failure
    }
    return data || []; // Return the data, or an empty array if null
};

// --- CREATE (POST) ---
export const addEvent = async (
    // We omit id, created_at, updated_at as Supabase handles them or they're set here
    eventData: Omit<Event, 'id' | 'created_at' | 'updated_at'>
): Promise<Event> => {
    const supabase = await createClient();

    const payload = {
        ...eventData
    };

    const { data, error } = await supabase
        .from('events')
        .insert([payload]) // Insert expects an array
        .select() // Select the newly inserted row
        .single(); // Expect a single object back

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
export const updateEvent = async (
    // `id` is required to know which event to update
    // `eventData` contains the fields to change
    eventDataToUpdate: Partial<Omit<Event, 'id' | 'created_at' | 'user_id'>> & { id: string }
): Promise<Event> => {
    const supabase = await createClient();

    const { id, ...updatePayload } = eventDataToUpdate;
    const payloadWithTimestamp = {
        ...updatePayload,
        updated_at: new Date().toISOString(), // Manually set updated_at
    };

    const { data, error } = await supabase
        .from('events')
        .update(payloadWithTimestamp)
        .eq('id', id) // Specify which row to update
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
export const deleteEvent = async (eventId: string): Promise<void> => {
    const supabase = await createClient();
    // Returns void because we don't get data back, just success/failure
    const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

    if (error) {
        console.error('Supabase error deleting event:', error);
        throw new Error(error.message);
    }
};