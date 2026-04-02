"use client";

import { useRef, useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  logWorkoutSession,
  createAndLogWorkout,
} from "@/app/(main)/dashboard/actions";
import type { Workout } from "@/lib/types";

/**
 * Two usage modes:
 *  1. workout is provided → log against existing workout
 *  2. workout is omitted + userId is provided → create an Unplanned Run then log it
 */
interface Props {
  workout?: Workout;
  userId?: string;
  /** Override the trigger button label. Defaults to "Start Session". */
  label?: string;
}

export function SessionLogModal({ workout, userId, label }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const durationRaw = fd.get("actual_duration_minutes") as string;
    const distanceRaw = fd.get("actual_distance_km") as string;
    const hrRaw = fd.get("actual_avg_hr") as string;
    const notes = fd.get("notes") as string;

    const logData = {
      actual_duration_minutes: durationRaw ? Number(durationRaw) : undefined,
      actual_distance_km: distanceRaw ? Number(distanceRaw) : undefined,
      actual_avg_hr: hrRaw ? Number(hrRaw) : undefined,
      notes: notes || undefined,
    };

    startTransition(async () => {
      let result: { error?: string };

      if (workout) {
        result = await logWorkoutSession(workout.id, logData);
      } else if (userId) {
        result = await createAndLogWorkout(userId, logData);
      } else {
        setError("No workout or user ID provided.");
        return;
      }

      if (result.error) {
        setError(result.error);
      } else {
        setOpen(false);
        setError(null);
        formRef.current?.reset();
      }
    });
  }

  // Placeholder for the duration field — use workout target if available
  const durationPlaceholder = workout?.duration_minutes
    ? String(workout.duration_minutes)
    : "e.g. 45";

  const showDistanceField =
    workout === undefined || workout.distance_km !== undefined;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button className="flex-1">{label ?? "Start Session"}</Button>}
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {workout ? `Log: ${workout.title}` : "Log a Run"}
          </DialogTitle>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="actual_duration_minutes">Duration (minutes)</Label>
            <Input
              id="actual_duration_minutes"
              name="actual_duration_minutes"
              type="number"
              min={0}
              placeholder={durationPlaceholder}
            />
          </div>
          {showDistanceField && (
            <div className="space-y-1">
              <Label htmlFor="actual_distance_km">Distance (km)</Label>
              <Input
                id="actual_distance_km"
                name="actual_distance_km"
                type="number"
                min={0}
                step="0.01"
                placeholder={
                  workout?.distance_km !== undefined
                    ? String(workout.distance_km)
                    : "e.g. 8.5"
                }
              />
            </div>
          )}
          <div className="space-y-1">
            <Label htmlFor="actual_avg_hr">Avg Heart Rate (bpm)</Label>
            <Input
              id="actual_avg_hr"
              name="actual_avg_hr"
              type="number"
              min={0}
              placeholder="e.g. 145"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="How did it go?"
              rows={3}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Saving..." : "Mark Completed"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
