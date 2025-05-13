import React from 'react';

import type { Event } from '@/lib/types/calendar';
import { EventListItem } from '@/components/calendar/event-list-item';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';


interface EventListProps {
    events: Event[];
    selectedDate: Date | undefined;
    onEditEvent: (event: Event) => void;
    onDeleteEvent: (eventId: string) => void;
    isDeletingEvent: boolean; // To disable buttons during delete
    isEventsLoading: boolean; // To show a loading indicator for the list
}

export const EventList: React.FC<EventListProps> = ({
                                                        events,
                                                        selectedDate,
                                                        onEditEvent,
                                                        onDeleteEvent,
                                                        isDeletingEvent,
                                                        isEventsLoading,
                                                    }) => {
    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl">
                    Events for {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'No date selected'}
                </CardTitle>
                {isDeletingEvent && (
                    <div className="flex items-center text-sm text-muted-foreground pt-1">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting event...
                    </div>
                )}
            </CardHeader>
            <CardContent>
                {isEventsLoading && !events.length ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Loading events...
                    </div>
                ) : events.length > 0 ? (
                    <ul className="space-y-4">
                        {events.map((event) => (
                            <li key={event.id}>
                                <EventListItem
                                    event={event}
                                    onEdit={onEditEvent}
                                    onDelete={onDeleteEvent}
                                    isDeleting={isDeletingEvent}
                                />
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
    );
};