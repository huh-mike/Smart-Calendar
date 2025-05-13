import React, {useCallback} from 'react';
import { Calendar } from '@/components/ui/calendar'; // Assuming shadcn/ui
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DayButtonProps } from 'react-day-picker';
import { format } from 'date-fns';
import type { Event } from '@/lib/types/calendar';


interface CalendarControlProps {
    selectedDate: Date | undefined;
    currentDisplayMonth: Date;
    onDateSelect: (date: Date | undefined) => void;
    onMonthChange: (month: Date) => void;
    onAddEventClick: () => void;
    allEvents: Event[];
    getEventsForDate: (date: Date, events: Event[]) => Event[];
}

export const CalendarControl: React.FC<CalendarControlProps> = ({
                                                                    selectedDate,
                                                                    currentDisplayMonth,
                                                                    onDateSelect,
                                                                    onMonthChange,
                                                                    onAddEventClick,
                                                                    allEvents,
                                                                    getEventsForDate,
                                                                }) => {
    // Custom Day Component to show event indicators

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


    return (
        <Card className="shadow-lg">
            <CardHeader><CardTitle className="text-2xl">Calendar Control</CardTitle></CardHeader>
            <CardContent className="flex flex-col items-center p-2 sm:p-4">
                <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={onDateSelect}
                    month={currentDisplayMonth}
                    onMonthChange={onMonthChange}
                    className="rounded-md border"
                    components={{
                        DayButton: CustomDayButtonComponent,
                    }}
                />
                <Button className="mt-6 w-full text-lg py-3" onClick={onAddEventClick}>
                    <PlusCircle className="mr-2 h-5 w-5" /> Add New Event
                </Button>
            </CardContent>
        </Card>
    );
};