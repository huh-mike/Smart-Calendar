export interface Event {
    id: string;
    user_id: string;
    title: string;
    description: string;
    location: string;
    start_time: string;
    end_time: string;
    is_all_day: boolean;
    time_zone: string;
    rrule?: string | null;
    recurrence_end?: string | null;
    exdates?: string[] | null; // Changed to string[] to match typical usage
    created_at: string;
    updated_at: string;
}