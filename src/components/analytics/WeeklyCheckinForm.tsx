"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveWeeklyCheckin } from "@/app/(main)/analytics/actions";
import type { WeeklyCheckin } from "@/lib/db";

interface Props {
  weekStart: Date;
  existing?: WeeklyCheckin | null;
}

const SCORE_LABELS: Record<number, string> = {
  1: "Very Low",
  2: "Low",
  3: "Moderate",
  4: "Good",
  5: "Excellent",
};

function ScoreSlider({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue: number;
}) {
  const [value, setValue] = useState(defaultValue);

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <Label htmlFor={name}>{label}</Label>
        <span className="text-muted-foreground text-xs">
          {value} — {SCORE_LABELS[value]}
        </span>
      </div>
      <input
        id={name}
        name={name}
        type="range"
        min={1}
        max={5}
        step={1}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="w-full accent-primary"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>1</span>
        <span>2</span>
        <span>3</span>
        <span>4</span>
        <span>5</span>
      </div>
    </div>
  );
}

export function WeeklyCheckinForm({ weekStart, existing }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const sleep_score = Number(fd.get("sleep_score"));
    const energy_level = Number(fd.get("energy_level"));
    const motivation_level = Number(fd.get("motivation_level"));
    const hrv_score = fd.get("hrv_score") as string;
    const notes = (fd.get("notes") as string).trim() || undefined;

    startTransition(async () => {
      const result = await saveWeeklyCheckin(weekStart, {
        sleep_score,
        energy_level,
        motivation_level,
        hrv_score: hrv_score ? Number(hrv_score) : undefined,
        notes,
      });

      if (result.error) {
        setError(result.error);
      } else {
        setError(null);
        setSaved(true);
      }
    });
  }

  if (saved) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        Check-in saved. Refresh to see updated scores.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ScoreSlider
        name="sleep_score"
        label="Sleep Quality"
        defaultValue={existing?.sleep_score ?? 3}
      />
      <ScoreSlider
        name="energy_level"
        label="Energy Level"
        defaultValue={existing?.energy_level ?? 3}
      />
      <ScoreSlider
        name="motivation_level"
        label="Motivation"
        defaultValue={existing?.motivation_level ?? 3}
      />
      <div className="space-y-1">
        <Label htmlFor="hrv_score">HRV Score (optional)</Label>
        <input
          id="hrv_score"
          name="hrv_score"
          type="number"
          min={0}
          max={300}
          defaultValue={existing?.hrv_score ?? ""}
          placeholder="e.g. 62"
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={existing?.notes ?? ""}
          placeholder="How are you feeling this week?"
          rows={2}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Saving..." : existing ? "Update Check-in" : "Log Check-in"}
      </Button>
    </form>
  );
}
