import React from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose
} from '@/components/ui/dialog'; // Assuming shadcn/ui
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { format, isValid } from 'date-fns';
import type { Event } from '@/lib/types/calendar';


// Props expected by the EventDialog, largely from useEventForm
interface EventDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    formState: {
        title: string;
        description: string;
        location: string;
        formSelectedDate: Date | undefined;
        startTime: string;
        endTime: string;
        formError: string | null;
        currentEditingEvent: Event | null;
        isLoading: boolean; // Combined loading from useEventForm
    };
    formActions: {
        setTitle: (value: string) => void;
        setDescription: (value: string) => void;
        setLocation: (value: string) => void;
        setStartTime: (value: string) => void;
        setEndTime: (value: string) => void;
        handleFormSubmit: () => void;
        closeDialogAndReset: () => void; // For cancel/close
    };
    mutationStates: { // Pass mutation pending states for finer control if needed
        isAddingEvent: boolean;
        isUpdatingEvent: boolean;
    }
}

export const EventDialogue: React.FC<EventDialogProps> = ({
                                                            isOpen,
                                                            onOpenChange,
                                                            formState,
                                                            formActions,
                                                            mutationStates
                                                        }) => {
    const { title, description, location, formSelectedDate, startTime, endTime, formError, currentEditingEvent, isLoading } = formState;
    const { setTitle, setDescription, setLocation, setStartTime, setEndTime, handleFormSubmit, closeDialogAndReset } = formActions;
    const { isAddingEvent, isUpdatingEvent } = mutationStates;

    const effectiveIsLoading = isLoading || isAddingEvent || isUpdatingEvent; // More comprehensive loading

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) { // If dialog is closed by overlay click or Escape key
                closeDialogAndReset();
            } else {
                onOpenChange(open); // For programmatic control
            }
        }}>
            <DialogContent className="sm:max-w-[480px]" onPointerDownOutside={(e) => {
                // Prevent closing if a mutation is in progress
                if (effectiveIsLoading) e.preventDefault();
            }}>
                <DialogHeader>
                    <DialogTitle className="text-xl">{currentEditingEvent ? 'Edit Event' : 'Add New Event'}</DialogTitle>
                    {formError && <DialogDescription className="text-red-500 pt-2">{formError}</DialogDescription>}
                    {(isAddingEvent || isUpdatingEvent) && ( // Use specific mutation states
                        <div className="flex items-center text-sm text-muted-foreground pt-2">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving event...
                        </div>
                    )}
                </DialogHeader>
                <div className="grid gap-5 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="title" className="text-right col-span-1">Title*</Label>
                        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" disabled={effectiveIsLoading} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="description" className="text-right col-span-1">Description</Label>
                        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3 min-h-[80px]" disabled={effectiveIsLoading} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="location" className="text-right col-span-1">Location</Label>
                        <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} className="col-span-3" disabled={effectiveIsLoading} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="date" className="text-right col-span-1">Date</Label>
                        <Input id="date" type="text" value={formSelectedDate && isValid(formSelectedDate) ? format(formSelectedDate, 'PPP (EEEE)') : 'No date selected'} disabled className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="startTime" className="text-right col-span-1">Start Time*</Label>
                        <Input id="startTime" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="col-span-3" disabled={effectiveIsLoading} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="endTime" className="text-right col-span-1">End Time*</Label>
                        <Input id="endTime" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="col-span-3" disabled={effectiveIsLoading} />
                    </div>
                </div>
                <DialogFooter className="sm:justify-between">
                    <DialogClose asChild>
                        <Button type="button" variant="outline" onClick={closeDialogAndReset} disabled={effectiveIsLoading}>Cancel</Button>
                    </DialogClose>
                    <Button type="submit" onClick={handleFormSubmit} disabled={effectiveIsLoading}>
                        {(isAddingEvent || isUpdatingEvent) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {currentEditingEvent ? 'Save Changes' : 'Create Event'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};