import { useState, useCallback } from 'react';
import { startOfMonth, parseISO, isValid } from 'date-fns';
import type { Event } from '@/lib/types/calendar'; // Adjust path as needed

/**
 * @description Manages the UI state of the calendar, such as selected date and current display month.
 * @param initialSelectedDate - The initially selected date for the calendar.
 */
export function useCalendarState(initialSelectedDate: Date = new Date(2025, 4, 10)) {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialSelectedDate);
    const [currentDisplayMonth, setCurrentDisplayMonth] = useState<Date>(startOfMonth(initialSelectedDate));

    const handleDateSelect = useCallback((date: Date | undefined) => {
        setSelectedDate(date);
        if (date) {
            // Optionally, set the display month if you want the calendar to jump
            // to the selected date's month if it's different.
            // setCurrentDisplayMonth(startOfMonth(date));
        }
    }, []);

    const handleMonthChange = useCallback((month: Date) => {
        setCurrentDisplayMonth(startOfMonth(month));
    }, []);

    /**
     * @description Filters and sorts events for a specific date.
     * @param date The date to filter events for.
     * @param allEvents An array of all events.
     * @returns An array of events for the given date, sorted by start time.
     */
    const getEventsForDate = useCallback((date: Date, allEvents: Event[]): Event[] => {
        if (!date || !allEvents) return [];
        return allEvents.filter(event => {
            const eventStartDate = parseISO(event.start_time);
            return isValid(eventStartDate) &&
                eventStartDate.getFullYear() === date.getFullYear() &&
                eventStartDate.getMonth() === date.getMonth() &&
                eventStartDate.getDate() === date.getDate();
        }).sort((a, b) => parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime());
    }, []);


    return {
        selectedDate,
        setSelectedDate,
        currentDisplayMonth,
        setCurrentDisplayMonth,
        handleDateSelect,
        handleMonthChange,
        getEventsForDate,
    };
}