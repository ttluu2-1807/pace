"use client";

import { useState, useTransition } from "react";
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
import { Switch } from "@/components/ui/switch";
import { createWorkout } from "@/app/(main)/dashboard/actions";
import type { WorkoutType } from "@/lib/types";

const WORKOUT_TYPES: { value: WorkoutType; label: string }[] = [
  { value: "easy", label: "Easy Run" },
  { value: "long", label: "Long Run" },
  { value: "tempo", label: "Tempo Run" },
  { value: "interval", label: "Intervals" },
  { value: "strides", label: "Strides" },
  { value: "hill-repeats", label: "Hill Repeats" },
  { value: "cross-training", label: "Cross Training" },
  { value: "recovery-walk", label: "Recovery Walk" },
  { value: "rest", label: "Rest Day" },
];

function todayString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

interface Props {
  userId: string;
  trigger?: React.ReactNode;
}

export function AddWorkoutModal({ userId, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // true = log completed run, false = plan future run
  const [isCompleted, setIsCompleted] = useState(true);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const date = fd.get("date") as string;
    const type = fd.get("type") as WorkoutType;
    const title = fd.get("title") as string;
    const distanceRaw = fd.get("distance_km") as string;
    const durationRaw = fd.get("duration_minutes") as string;
    const notes = fd.get("notes") as string;

    if (!date) {
      setError("Date is required.");
      return;
    }
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    const distance_km = distanceRaw ? Number(distanceRaw) : undefined;
    const duration_minutes = durationRaw ? Number(durationRaw) : 0;

    startTransition(async () => {
      const result = await createWorkout(userId, {
        date,
        type,
        title: title.trim(),
        description: "",
        duration_minutes,
        distance_km,
        notes: notes || undefined,
        completed: isCompleted,
        // When logging a completed run, also fill actual fields
        ...(isCompleted
          ? {
              actual_duration_minutes: duration_minutes || undefined,
              actual_distance_km: distance_km,
            }
          : {}),
      });

      if (result.error) {
        setError(result.error);
      } else {
        setOpen(false);
        setError(null);
      }
    });
  }

  const triggerEl = trigger ?? <Button>Log a Run</Button>;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={triggerEl as React.ReactElement} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isCompleted ? "Log a Run" : "Plan a Workout"}
          </DialogTitle>
        </DialogHeader>

        {/* Mode toggle */}
        <div className="flex items-center gap-3 rounded-lg border border-input bg-muted/40 px-3 py-2">
          <span className="text-sm text-muted-foreground flex-1">
            {isCompleted ? "Logging a completed run" : "Planning a future run"}
          </span>
          <Switch
            checked={isCompleted}
            onCheckedChange={setIsCompleted}
            aria-label="Toggle between log completed and plan future run"
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="add-date">Date</Label>
            <Input
              id="add-date"
              name="date"
              type="date"
              defaultValue={todayString()}
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="add-type">Type</Label>
            <select
              id="add-type"
              name="type"
              defaultValue="easy"
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {WORKOUT_TYPES.map((wt) => (
                <option key={wt.value} value={wt.value}>
                  {wt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="add-title">Title</Label>
            <Input
              id="add-title"
              name="title"
              placeholder="e.g. Morning easy run"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="add-distance">Distance (km)</Label>
              <Input
                id="add-distance"
                name="distance_km"
                type="number"
                min={0}
                step="0.01"
                placeholder="e.g. 8.5"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="add-duration">Duration (min)</Label>
              <Input
                id="add-duration"
                name="duration_minutes"
                type="number"
                min={0}
                placeholder="e.g. 45"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="add-notes">Notes</Label>
            <Textarea
              id="add-notes"
              name="notes"
              placeholder={
                isCompleted
                  ? "How did it go? Any notes?"
                  : "What's the goal for this run?"
              }
              rows={2}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending
                ? "Saving..."
                : isCompleted
                  ? "Log Run"
                  : "Add to Schedule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
