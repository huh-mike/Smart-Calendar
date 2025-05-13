import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Edit3, Trash2 } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';

import type { Event } from '@/lib/types/calendar';

interface EventListItemProps {
    event: Event;
    onEdit: (event: Event) => void;
    onDelete: (eventId: string) => void;
    isDeleting: boolean;
}

export const EventListItem: React.FC<EventListItemProps> = ({ event, onEdit, onDelete, isDeleting }) => {
    const eventStartDate = parseISO(event.start_time);
    const eventEndDate = parseISO(event.end_time);

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-xl">{event.title}</CardTitle>
                        <CardDescription className="text-sm mt-1">
                            {isValid(eventStartDate) ? format(eventStartDate, 'p') : 'Invalid start'}
                            {' - '}
                            {isValid(eventEndDate) ? format(eventEndDate, 'p') : 'Invalid end'}
                            {event.location && ` @ ${event.location}`}
                        </CardDescription>
                    </div>
                    <div className="flex space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => onEdit(event)} aria-label="Edit Event" disabled={isDeleting}>
                            <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onDelete(event.id)} aria-label="Delete Event" className="text-red-500 hover:text-red-700" disabled={isDeleting}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            {event.description && (
                <CardContent>
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                </CardContent>
            )}
        </Card>
    );
};