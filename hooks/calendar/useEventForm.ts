import { useState, useCallback, useEffect } from 'react';
import { format, parseISO, isValid, setHours, setMinutes, setSeconds, setMilliseconds } from 'date-fns';
import type { Event } from '@/lib/types/calendar'; // Adjust path

// Define the types for the mutation functions this hook expects
type AddEventMutationFn = (eventData: Omit<Event, 'id' | 'created_at' | 'updated_at'>) => void;
type UpdateEventMutationFn = (eventData: Partial<Omit<Event, 'created_at' | 'user_id'>> & { id: string }) => void;

interface UseEventFormProps {
    userId: string | null; // Needed to associate event with user
    selectedDateProp: Date | undefined; // The currently selected date from the calendar
    addEventMutation: AddEventMutationFn; // Function to call for adding
    updateEventMutation: UpdateEventMutationFn; // Function to call for updating
    isAdding: boolean; // Loading state for add mutation
    isUpdating: boolean; // Loading state for update mutation
}

/**
 * @description Custom hook to manage the state and logic of the event add/edit form dialog.
 * @param {UseEventFormProps} props - Props including mutation functions and loading states.
 * @returns {object} - Form state, handlers, dialog state, and error state.
 */
export function useEventForm({
                                 userId,
                                 selectedDateProp,
                                 addEventMutation,
                                 updateEventMutation,
                                 isAdding,
                                 isUpdating,
                             }: UseEventFormProps) {
    // --- Dialog State ---
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [currentEditingEvent, setCurrentEditingEvent] = useState<Event | null>(null);

    // --- Form Input States ---
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    // Store selected date for the form separately in case calendar selection changes while form is open
    const [formSelectedDate, setFormSelectedDate] = useState<Date | undefined>(selectedDateProp);
    const [startTime, setStartTime] = useState('12:00'); // Default start time
    const [endTime, setEndTime] = useState('13:00');   // Default end time
    const [formError, setFormError] = useState<string | null>(null);

    // Keep form date in sync with calendar selection *when the form is not open*
    // or when the selected date changes *while* the form is open for a *new* event.
    useEffect(() => {
        if (!isFormOpen || (isFormOpen && !currentEditingEvent)) {
            setFormSelectedDate(selectedDateProp);
            // Optionally reset default times if date changes for a new event form
            if (isFormOpen && !currentEditingEvent && selectedDateProp) {
                const baseDate = selectedDateProp || new Date();
                setStartTime(format(setHours(baseDate, 12), 'HH:mm'));
                setEndTime(format(setHours(baseDate, 13), 'HH:mm'));
            }
        }
    }, [selectedDateProp, isFormOpen, currentEditingEvent]);


    // --- Form Handling Logic ---

    const resetForm = useCallback(() => {
        setTitle('');
        setDescription('');
        setLocation('');
        setFormError(null);
        setCurrentEditingEvent(null);
        // Reset date to current calendar selection or today
        const dateToUse = selectedDateProp || new Date();
        setFormSelectedDate(dateToUse);
        // Reset times based on the date
        setStartTime(format(setHours(dateToUse, 12), 'HH:mm'));
        setEndTime(format(setHours(dateToUse, 13), 'HH:mm'));
    }, [selectedDateProp]); // Dependency on selectedDateProp to reset based on current calendar

    const openAddEventDialog = useCallback(() => {
        resetForm();
        // Ensure a date is selected for the form
        if (!formSelectedDate) {
            setFormSelectedDate(new Date()); // Default to today if nothing selected
        }
        setIsFormOpen(true);
    }, [resetForm, formSelectedDate]);

    const openEditEventDialog = useCallback((event: Event) => {
        setCurrentEditingEvent(event);
        setTitle(event.title);
        setDescription(event.description || '');
        setLocation(event.location || '');
        setFormError(null);

        const eventStartDate = parseISO(event.start_time);
        const eventEndDate = parseISO(event.end_time);

        if (isValid(eventStartDate)) {
            setStartTime(format(eventStartDate, 'HH:mm'));
            setFormSelectedDate(eventStartDate); // Set form date to the event's date
        } else {
            // Fallback if date is invalid (should ideally not happen)
            setStartTime('12:00');
            setFormSelectedDate(selectedDateProp || new Date());
        }

        if (isValid(eventEndDate)) {
            setEndTime(format(eventEndDate, 'HH:mm'));
        } else {
            setEndTime('13:00');
        }
        setIsFormOpen(true);
    }, [selectedDateProp]); // Include selectedDateProp as fallback

    const handleFormSubmit = useCallback(() => {
        setFormError(null); // Clear previous errors

        if (!userId) {
            setFormError('User not identified. Please log in again.');
            return;
        }

        if (!title.trim() || !startTime || !endTime || !formSelectedDate) {
            setFormError('Title, start time, end time, and a selected date are required.');
            return;
        }

        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);

        if (isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute)) {
            setFormError('Invalid time format. Please use HH:mm.');
            return;
        }

        // Create date objects from the form's selected date and the time inputs
        let baseDate = new Date(formSelectedDate);
        // IMPORTANT: Clear time part from baseDate to avoid timezone issues when setting hours/minutes
        baseDate = setMilliseconds(setSeconds(setMinutes(setHours(baseDate, 0), 0), 0), 0);

        const startDateTime = setMinutes(setHours(new Date(baseDate), startHour), startMinute);
        const endDateTime = setMinutes(setHours(new Date(baseDate), endHour), endMinute);


        if (endDateTime <= startDateTime) {
            setFormError('End time must be after start time.');
            return;
        }

        // Construct the payload for the API
        const eventPayloadBase = {
            // user_id is now required by the mutation functions we defined
            user_id: userId, // Include the user ID
            title: title.trim(),
            description: description.trim() || null,
            location: location.trim() || null, // Send null if empty
            start_time: startDateTime.toISOString(),
            end_time: endDateTime.toISOString(),
            // Defaults - add UI controls if these need to be configurable
            is_all_day: false,
            time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Get user's browser timezone
        };

        // Call the appropriate mutation function passed in props
        if (currentEditingEvent?.id) {
            // Update requires the ID
            updateEventMutation({ ...eventPayloadBase, id: currentEditingEvent.id });
        } else {
            // Add requires the payload without id, created_at, updated_at
            // Type assertion might be needed if TS complains, but structure matches
            addEventMutation(eventPayloadBase as Omit<Event, 'id' | 'created_at' | 'updated_at'>);
        }

        // Note: Closing the dialog and resetting the form is often handled
        // in the `onSuccess` callback of the mutations within the component
        // that *uses* this hook, or you could add `onSuccess` callbacks as props.
        // For simplicity here, we assume success closes the dialog.
        // We might conditionally close based on mutation success later.
        // setIsFormOpen(false); // Consider moving this based on mutation success

    }, [
        userId, title, description, location, startTime, endTime, formSelectedDate,
        currentEditingEvent, addEventMutation, updateEventMutation
    ]);

    // Function to explicitly close the dialog and reset the form
    const closeDialogAndReset = useCallback(() => {
        setIsFormOpen(false);
        // Delay reset slightly to allow closing animation
        setTimeout(resetForm, 150);
    }, [resetForm]);

    return {
        // Dialog State & Control
        isFormOpen,
        setIsFormOpen, // Allow external control if needed
        currentEditingEvent,
        closeDialogAndReset, // Use this for cancel/close buttons

        // Form Fields State
        title,
        setTitle,
        description,
        setDescription,
        location,
        setLocation,
        formSelectedDate, // The date used *by the form*
        startTime,
        setStartTime,
        endTime,
        setEndTime,

        // Form Actions & State
        openAddEventDialog,
        openEditEventDialog,
        handleFormSubmit,
        formError,
        setFormError, // Allow clearing error externally if needed
        isLoading: isAdding || isUpdating, // Combined loading state
    };
}
