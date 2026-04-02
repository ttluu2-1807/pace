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
import { modifyWorkout } from "@/app/(main)/dashboard/actions";
import type { Workout } from "@/lib/types";

interface Props {
  workout: Workout;
}

export function ModifyWorkoutModal({ workout }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const title = fd.get("title") as string;
    const description = fd.get("description") as string;
    const durationRaw = fd.get("duration_minutes") as string;
    const distanceRaw = fd.get("distance_km") as string;

    startTransition(async () => {
      const result = await modifyWorkout(workout.id, {
        title: title || undefined,
        description: description || undefined,
        duration_minutes: durationRaw ? Number(durationRaw) : undefined,
        distance_km: distanceRaw ? Number(distanceRaw) : undefined,
      });
      if (result.error) {
        setError(result.error);
      } else {
        setOpen(false);
        setError(null);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant="outline" className="flex-1">Modify</Button>}
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modify Workout</DialogTitle>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              defaultValue={workout.title}
              placeholder="Workout title"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={workout.description}
              placeholder="Workout description"
              rows={3}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="duration_minutes">Duration (minutes)</Label>
            <Input
              id="duration_minutes"
              name="duration_minutes"
              type="number"
              min={1}
              defaultValue={workout.duration_minutes}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="distance_km">Distance (km)</Label>
            <Input
              id="distance_km"
              name="distance_km"
              type="number"
              min={0}
              step="0.01"
              defaultValue={workout.distance_km ?? ""}
              placeholder="Optional"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
