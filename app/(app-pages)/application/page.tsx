'use client';

import {useCallback, useMemo} from 'react';
import {Button} from '@/components/ui/button';

// Types
import {Event} from '@/lib/types/calendar';

import {useQueryClient} from '@tanstack/react-query';
import {AlertTriangle, Loader2} from 'lucide-react';

import { useEventDataManager } from "@/hooks/calendar/useEventDataManager";

import {useAuth} from "@/hooks/auth/useAuth";
import {useCalendarState} from "@/hooks/calendar/useCalendarState";
import {useEventForm} from "@/hooks/calendar/useEventForm";
import {EventDialogue} from "@/components/calendar/event-dialogue";
import {EventList} from "@/components/calendar/event-list";
import {CalendarControl} from "@/components/calendar/calendar-control";


export default function AppPage() {
    const queryClient = useQueryClient();

    // 1. Authentication Hook
    const {
        user,
        userId,
        isLoading: isLoadingUser, // Renamed from isLoadingUser for clarity at this level
        isError: isErrorUser,
        error: userError,
        refetchUser,
    } = useAuth();

    // 2. Calendar UI State Hook
    const {
        selectedDate,
        currentDisplayMonth,
        handleDateSelect,
        handleMonthChange,
        getEventsForDate, // Utility from useCalendarState
    } = useCalendarState(new Date(2025, 4, 10)); // Initial date

    // 3. Event Data Management Hook (CRUD operations)
    const {
        events: allEvents,
        isLoadingEvents,
        isFetchingEvents,
        isErrorEvents,
        eventsError,
        refetchEvents,
        addEvent,
        isAddingEvent,
        updateEvent,
        isUpdatingEvent,
        deleteEvent,
        isDeletingEvent,
    } = useEventDataManager(userId); // Pass userId to enable/disable query and for query key

    // 4. Event Form Management Hook
    const eventForm = useEventForm({
        userId,
        selectedDateProp: selectedDate, // Pass current calendar selection
        addEventMutation: addEvent, // Pass mutation function from useEventDataManager
        updateEventMutation: updateEvent, // Pass mutation function
        isAdding: isAddingEvent, // Pass loading state
        isUpdating: isUpdatingEvent, // Pass loading state
    });

    // Derived state: Events for the currently selected date
    const eventsForSelectedDate = useMemo(() => {
        if (!selectedDate) return [];
        return getEventsForDate(selectedDate, allEvents || []);
    }, [selectedDate, allEvents, getEventsForDate]);

    // --- Event Handlers for UI actions ---
    const handleOpenAddEventDialog = () => {
        eventForm.openAddEventDialog();
    };

    const handleOpenEditEventDialog = (eventToEdit: Event) => {
        eventForm.openEditEventDialog(eventToEdit);
    };

    const handleDeleteEvent = useCallback((eventId: string) => {
        if (window.confirm('Are you sure you want to delete this event?')) {
            deleteEvent(eventId);
        }
    }, [deleteEvent]);



    // --- Conditional Rendering for Loading/Error States ---
    if (isLoadingEvents) { // Only initial loading state
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600"/>
                <p className="ml-4 text-lg">Loading events...</p>
            </div>
        );
    }

    if (isErrorEvents && eventsError) {
        return (
            <div className="container mx-auto p-8 text-center">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4"/>
                <h2 className="text-2xl font-semibold text-red-600 mb-2">Error Loading Events</h2>
                <p className="text-red-500">{eventsError.message}</p>
                <Button onClick={() => queryClient.refetchQueries({queryKey: ['events']})} className="mt-4">
                    Try Again
                </Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 lg:p-8">
            <header className="mb-8 text-center">
                <h1 className="text-4xl font-bold tracking-tight">My Calendar</h1>
                <p className="text-muted-foreground flex items-center justify-center">
                    Welcome, {user?.email || 'User'}!
                    {(isFetchingEvents && !isLoadingEvents) && <Loader2 className="ml-2 h-5 w-5 animate-spin text-blue-500" aria-label="Refreshing events..." />}
                </p>
            </header>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Left Sidebar: Calendar Control and Add Event Button */}
                <aside className="w-full lg:w-1/3 xl:w-1/4">
                    <CalendarControl
                        selectedDate={selectedDate}
                        currentDisplayMonth={currentDisplayMonth}
                        onDateSelect={handleDateSelect}
                        onMonthChange={handleMonthChange}
                        onAddEventClick={handleOpenAddEventDialog}
                        allEvents={allEvents || []}
                        getEventsForDate={getEventsForDate}
                    />
                </aside>

                {/* Main Content: Event List for Selected Date */}
                <main className="flex-1">
                    <EventList
                        events={eventsForSelectedDate}
                        selectedDate={selectedDate}
                        onEditEvent={handleOpenEditEventDialog}
                        onDeleteEvent={handleDeleteEvent}
                        isDeletingEvent={isDeletingEvent}
                        isEventsLoading={isFetchingEvents} // Show loading in list during refetches
                    />
                </main>
            </div>

            {/* Event Form Dialog: Controlled by useEventForm */}
            <EventDialogue
                isOpen={eventForm.isFormOpen}
                onOpenChange={(isOpen) => {
                    if (!isOpen) eventForm.closeDialogAndReset();
                    else eventForm.setIsFormOpen(isOpen); // Allow programmatic opening
                }}
                formState={{
                    title: eventForm.title,
                    description: eventForm.description,
                    location: eventForm.location,
                    formSelectedDate: eventForm.formSelectedDate,
                    startTime: eventForm.startTime,
                    endTime: eventForm.endTime,
                    formError: eventForm.formError,
                    currentEditingEvent: eventForm.currentEditingEvent,
                    isLoading: eventForm.isLoading, // Combined loading from useEventForm
                }}
                formActions={{
                    setTitle: eventForm.setTitle,
                    setDescription: eventForm.setDescription,
                    setLocation: eventForm.setLocation,
                    setStartTime: eventForm.setStartTime,
                    setEndTime: eventForm.setEndTime,
                    handleFormSubmit: eventForm.handleFormSubmit,
                    closeDialogAndReset: eventForm.closeDialogAndReset,
                }}
                mutationStates={{ // Pass specific mutation states for more granular control in dialog
                    isAddingEvent: isAddingEvent,
                    isUpdatingEvent: isUpdatingEvent,
                }}
            />
        </div>
    );
}