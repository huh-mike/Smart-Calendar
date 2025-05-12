'use client';

import {useCallback, useEffect, useMemo, useState} from 'react';
import {Calendar} from '@/components/ui/calendar';
import {Button} from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {Label} from '@/components/ui/label';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Event} from '@/lib/types/calendar';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {addEvent, deleteEvent, fetchEvents, updateEvent} from '@/lib/api/events';
import {format, isValid, parseISO, setHours, setMilliseconds, setMinutes, setSeconds, startOfMonth} from 'date-fns';
import {AlertTriangle, Edit3, Loader2, PlusCircle, Trash2} from 'lucide-react';

import {useUserStore} from "@/stores/userStore";

import type { DayButtonProps } from 'react-day-picker';


export default function AppPage() {

    const fetchUserId = useUserStore((state) => state.fetchUserId);
    const isLoading = useUserStore((state) => state.isLoading);
    const userId = useUserStore((state) => state.userId);

    useEffect(() => {
        const storeState = useUserStore.getState();
        if (!storeState.userId && !storeState.isLoading && !storeState.error) {
            console.log('Attempting to fetch user ID.');
            fetchUserId();
        } else {
            console.log('User ID fetch skipped (already loaded, loading, or error).', {
                userId: storeState.userId,
                isLoading: storeState.isLoading,
                error: storeState.error
            });
        }
    }, [fetchUserId]);

    const queryClient = useQueryClient();

    // --- Local UI State ---
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => {
        return new Date(2025, 4, 10);
    });
    const [currentDisplayMonth, setCurrentDisplayMonth] = useState<Date>(() => startOfMonth(selectedDate || new Date(2025, 4, 1)));

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [currentEditingEvent, setCurrentEditingEvent] = useState<Event | null>(null);


    // Form input states
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [startTime, setStartTime] = useState('12:00'); // Default start time for new events
    const [endTime, setEndTime] = useState('13:00');   // Default end time for new events
    const [formError, setFormError] = useState<string | null>(null);

    // --- TanStack Query for Fetching Events ---
    const {
        data: allEvents = [], // Default to empty array if `data` is undefined
        isLoading: isLoadingEvents,
        isError: isErrorEvents,
        error: eventsError, // The error object
        isFetching: isFetchingEvents, // True if currently fetching (initial or background)
    } = useQuery<Event[], Error>({ // Explicitly type data and error
        queryKey: ['events'], // Unique key for this query. If you add filters, include them here e.g. ['events', { month: 5 }]
        queryFn: fetchEvents,  // The function that fetches the data from Supabase
    });

    // --- TanStack Query Mutations ---

    // ADD Event Mutation
    const addEventMutation = useMutation({
        mutationFn: addEvent, // API function
        onSuccess: (newEventData) => {
            // Option 1: Invalidate and refetch (simplest)
            queryClient.invalidateQueries({queryKey: ['events']});

            // Option 2: Manually update the cache (more advanced, faster UI update)
            // queryClient.setQueryData(['events'], (oldData: CalendarEvent[] | undefined) => {
            //   return oldData ? [...oldData, newEventData] : [newEventData];
            // });

            setIsFormOpen(false);
            resetForm();
        },
        onError: (error: Error) => {
            setFormError(`Failed to add event: ${error.message}`);
        },
    });

    // UPDATE Event Mutation
    const updateEventMutation = useMutation({
        mutationFn: updateEvent,
        onSuccess: (updatedEventData) => {
            queryClient.invalidateQueries({queryKey: ['events']});
            // Or manually update:
            // queryClient.setQueryData(['events'], (oldData: CalendarEvent[] | undefined) =>
            //   oldData?.map(event => event.id === updatedEventData.id ? updatedEventData : event)
            // );
            setIsFormOpen(false);
            resetForm();
        },
        onError: (error: Error) => {
            setFormError(`Failed to update event: ${error.message}`);
        },
    });

    // DELETE Event Mutation
    const deleteEventMutation = useMutation({
        mutationFn: deleteEvent, // API function (takes eventId)
        onSuccess: (data, eventId) => { // `variables` (eventId here) is the second argument
            queryClient.invalidateQueries({queryKey: ['events']});
            // Or manually update:
            // queryClient.setQueryData(['events'], (oldData: CalendarEvent[] | undefined) =>
            //   oldData?.filter(event => event.id !== eventId)
            // );
        },
        onError: (error: Error) => {
            // You might want a more user-friendly error display, e.g., a toast notification
            alert(`Failed to delete event: ${error.message}`);
        },
    });

    // --- Derived State and Callbacks ---
    const getEventsForDate = useCallback((date: Date, eventsList: Event[]): Event[] => {
        if (!date || !eventsList) return [];
        return eventsList.filter(event => {
            const eventStartDate = parseISO(event.start_time);
            return isValid(eventStartDate) &&
                eventStartDate.getFullYear() === date.getFullYear() &&
                eventStartDate.getMonth() === date.getMonth() &&
                eventStartDate.getDate() === date.getDate();
        }).sort((a, b) => parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime());
    }, []);

    const eventsForSelectedDate = useMemo(() => {
        if (!selectedDate) return [];
        return getEventsForDate(selectedDate, allEvents);
    }, [selectedDate, allEvents, getEventsForDate]);

    const handleDateSelect = useCallback((date: Date | undefined) => {
        setSelectedDate(date);
        if (date) {
            setCurrentDisplayMonth(startOfMonth(date));
        }
    }, []);

    const handleMonthChange = useCallback((month: Date) => {
        setCurrentDisplayMonth(startOfMonth(month));
        // Optionally, if you were fetching events per month:
        // queryClient.prefetchQuery({ queryKey: ['events', { month: month.getMonth(), year: month.getFullYear() }], queryFn: ... })
    }, []);


    const resetForm = () => {
        setTitle('');
        setDescription('');
        setLocation('');
        const defaultTimeBase = selectedDate || new Date();
        setStartTime(format(setHours(defaultTimeBase, 12), 'HH:mm'));
        setEndTime(format(setHours(defaultTimeBase, 13), 'HH:mm'));
        setFormError(null);
        setCurrentEditingEvent(null);
    };

    const openAddEventDialog = () => {
        resetForm();
        // Ensure selectedDate is set for the form if user clicks "Add New Event"
        if (!selectedDate) {
            const today = new Date();
            setSelectedDate(today);
            setCurrentDisplayMonth(startOfMonth(today));
        }
        setIsFormOpen(true);
    };

    const openEditEventDialog = (event: Event) => {
        setCurrentEditingEvent(event);
        setTitle(event.title);
        setDescription(event.description || '');
        setLocation(event.location || '');
        setFormError(null);

        const eventStartDate = parseISO(event.start_time);
        const eventEndDate = parseISO(event.end_time);

        if (isValid(eventStartDate)) {
            setStartTime(format(eventStartDate, 'HH:mm'));
            setSelectedDate(eventStartDate); // Ensure calendar reflects the event's date
            setCurrentDisplayMonth(startOfMonth(eventStartDate));
        } else {
            setStartTime('12:00');
        }

        if (isValid(eventEndDate)) {
            setEndTime(format(eventEndDate, 'HH:mm'));
        } else {
            setEndTime('13:00');
        }
        setIsFormOpen(true);
    };

    const handleFormSubmit = () => {
        setFormError(null);
        if (!title.trim() || !startTime || !endTime || !selectedDate) {
            setFormError('Title, start time, end time, and a selected date are required.');
            return;
        }

        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);

        if (isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute)) {
            setFormError('Invalid time format.');
            return;
        }

        let baseDate = new Date(selectedDate); // Use the date part of selectedDate
        baseDate = setMilliseconds(setSeconds(setMinutes(setHours(baseDate, 0), 0), 0), 0); // Clear time part

        const startDateTime = setMinutes(setHours(new Date(baseDate), startHour), startMinute);
        const endDateTime = setMinutes(setHours(new Date(baseDate), endHour), endMinute);

        if (endDateTime <= startDateTime) {
            setFormError('End time must be after start time.');
            return;
        }

        const eventPayloadBase = {
            user_id: userId,
            title: title.trim(),
            description: description.trim(),
            location: location.trim(),
            start_time: startDateTime.toISOString(),
            end_time: endDateTime.toISOString(),
            is_all_day: false, // Add UI for this if needed
            time_zone: 'Asia/Singapore', // Or make configurable
            // rrule, recurrence_end, exdates are not handled in this simplified form
        };

        if (currentEditingEvent && currentEditingEvent.id) {
            updateEventMutation.mutate({...eventPayloadBase, id: currentEditingEvent.id});
        } else {
            // For addEvent, the API function expects Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>
            // Our eventPayloadBase already fits this.
            addEventMutation.mutate(eventPayloadBase as Omit<Event, 'id' | 'created_at' | 'updated_at'>);
        }
    };

    const handleDeleteEvent = (eventId: string) => {
        if (window.confirm('Are you sure you want to delete this event?')) {
            deleteEventMutation.mutate(eventId);
        }
    };

    const CustomDayButtonComponent = useCallback(
        (props: DayButtonProps) => { // Use the DayButtonProps type from your environment
            const { day, modifiers, ...buttonHtmlAttributes } = props;

            // Assuming 'CalendarDay' (type of 'day') has a 'date' property which is a JS Date object.
            // And 'modifiers' object directly tells us if it's an "outside" day.
            const actualDate = day.date; // This is the JS Date object for the current day cell
            const isOutside = day.outside; // Check if the day is outside the displayed month

            const dayEvents = getEventsForDate(actualDate, allEvents); // `allEvents` is from useQuery

            return (
                <button
                    type="button"
                    {...buttonHtmlAttributes} // Spread all original button attributes (className, onClick, disabled, etc.)
                    // This is CRUCIAL for maintaining Shadcn's styling and react-day-picker's functionality
                >
                    {format(actualDate, "d")} {/* Render the day number from the actualDate */}
                    {!isOutside && dayEvents.length > 0 && (
                        <span
                            aria-hidden="true"
                            className="absolute translate-y-2.5 w-1 h-1 bg-blue-500 rounded-full"
                            // You might need to fine-tune these classes for perfect alignment
                        />
                    )}
                </button>
            );
        },
        [allEvents, getEventsForDate] // Dependencies for useCallback
    );

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
                    Using TanStack Query & Supabase
                    {isFetchingEvents && !isLoadingEvents && <Loader2 className="ml-2 h-5 w-5 animate-spin text-blue-500" aria-label="Refreshing events..." />}
                </p>
            </header>
            <div className="flex flex-col lg:flex-row gap-8">
                <aside className="w-full lg:w-1/3 xl:w-1/4">
                    <Card className="shadow-lg">
                        <CardHeader><CardTitle className="text-2xl">Calendar Control</CardTitle></CardHeader>
                        <CardContent className="flex justify-center p-2 sm:p-4">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={handleDateSelect}
                                month={currentDisplayMonth} // Control displayed month
                                onMonthChange={handleMonthChange} // Handle month navigation
                                className="rounded-md border"
                                components={{
                                    DayButton: CustomDayButtonComponent, // Use the MODIFIED component here
                                }}
                            />
                        </CardContent>
                    </Card>
                    <Dialog open={isFormOpen} onOpenChange={(isOpen) => {
                        setIsFormOpen(isOpen);
                        if (!isOpen) resetForm(); // Reset form when dialog is programmatically closed or via overlay click
                    }}>
                        <DialogTrigger asChild>
                            <Button className="mt-6 w-full text-lg py-3" onClick={openAddEventDialog}>
                                <PlusCircle className="mr-2 h-5 w-5" /> Add New Event
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[480px]">
                            <DialogHeader>
                                <DialogTitle className="text-xl">{currentEditingEvent ? 'Edit Event' : 'Add New Event'}</DialogTitle>
                                {formError && <DialogDescription className="text-red-500 pt-2">{formError}</DialogDescription>}
                                {(addEventMutation.isPending || updateEventMutation.isPending) && (
                                    <div className="flex items-center text-sm text-muted-foreground pt-2">
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving event...
                                    </div>
                                )}
                            </DialogHeader>
                            {/* Form Grid - Inputs should be disabled during mutation */}
                            <div className="grid gap-5 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="title" className="text-right col-span-1">Title*</Label>
                                    <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" disabled={addEventMutation.isPending || updateEventMutation.isPending} />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="description" className="text-right col-span-1">Description</Label>
                                    <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3 min-h-[80px]" disabled={addEventMutation.isPending || updateEventMutation.isPending}/>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="location" className="text-right col-span-1">Location</Label>
                                    <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} className="col-span-3" disabled={addEventMutation.isPending || updateEventMutation.isPending}/>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="date" className="text-right col-span-1">Date</Label>
                                    <Input id="date" type="text" value={selectedDate ? format(selectedDate, 'PPP (EEEE)') : 'No date selected'} disabled className="col-span-3" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="startTime" className="text-right col-span-1">Start Time*</Label>
                                    <Input id="startTime" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="col-span-3" disabled={addEventMutation.isPending || updateEventMutation.isPending}/>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="endTime" className="text-right col-span-1">End Time*</Label>
                                    <Input id="endTime" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="col-span-3" disabled={addEventMutation.isPending || updateEventMutation.isPending}/>
                                </div>
                            </div>
                            <DialogFooter className="sm:justify-between">
                                <DialogClose asChild>
                                    <Button type="button" variant="outline" disabled={addEventMutation.isPending || updateEventMutation.isPending}>Cancel</Button>
                                </DialogClose>
                                <Button type="submit" onClick={handleFormSubmit} disabled={addEventMutation.isPending || updateEventMutation.isPending}>
                                    {(addEventMutation.isPending || updateEventMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {currentEditingEvent ? 'Save Changes' : 'Create Event'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </aside>

                <main className="flex-1">
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-2xl">
                                Events for {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'No date selected'}
                            </CardTitle>
                            {deleteEventMutation.isPending && (
                                <div className="flex items-center text-sm text-muted-foreground pt-1">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting event...
                                </div>
                            )}
                        </CardHeader>
                        <CardContent>
                            {eventsForSelectedDate.length > 0 ? (
                                <ul className="space-y-4">
                                    {eventsForSelectedDate.map((event) => (
                                        <li key={event.id}>
                                            <Card className="hover:shadow-md transition-shadow">
                                                <CardHeader>
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <CardTitle className="text-xl">{event.title}</CardTitle>
                                                            <CardDescription className="text-sm mt-1">
                                                                {isValid(parseISO(event.start_time)) ? format(parseISO(event.start_time), 'p') : 'Invalid start'} - {isValid(parseISO(event.end_time)) ? format(parseISO(event.end_time), 'p') : 'Invalid end'}
                                                                {event.location && ` @ ${event.location}`}
                                                            </CardDescription>
                                                        </div>
                                                        <div className="flex space-x-1">
                                                            <Button variant="ghost" size="icon" onClick={() => openEditEventDialog(event)} aria-label="Edit Event" disabled={deleteEventMutation.isPending}>
                                                                <Edit3 className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteEvent(event.id)} aria-label="Delete Event" className="text-red-500 hover:text-red-700" disabled={deleteEventMutation.isPending}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardHeader>
                                                {event.description && ( <CardContent> <p className="text-sm text-muted-foreground">{event.description}</p> </CardContent> )}
                                            </Card>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-center text-muted-foreground py-8">
                                    {selectedDate ? "No events for this day. Add one!" : "Select a date to view events."}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </main>
            </div>
        </div>
    );
}