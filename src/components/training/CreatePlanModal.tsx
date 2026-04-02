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
import { createPlan } from "@/app/(main)/training/actions";

const RACE_TYPES = [
  { value: "5k", label: "5K" },
  { value: "10k", label: "10K" },
  { value: "half-marathon", label: "Half Marathon" },
  { value: "marathon", label: "Marathon" },
  { value: "general", label: "General Fitness" },
] as const;

interface Props {
  trigger?: React.ReactNode;
}

export function CreatePlanModal({ trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = fd.get("name") as string;
    const race_type = (fd.get("race_type") as string) || undefined;
    const race_date = (fd.get("race_date") as string) || undefined;
    const total_weeks = Number(fd.get("total_weeks") as string);

    if (!name.trim()) {
      setError("Plan name is required.");
      return;
    }
    if (!total_weeks || total_weeks < 1) {
      setError("Total weeks must be at least 1.");
      return;
    }

    startTransition(async () => {
      const result = await createPlan({
        name: name.trim(),
        race_type: race_type as "5k" | "10k" | "half-marathon" | "marathon" | "general" | undefined,
        race_date,
        total_weeks,
      });
      if (result.error) {
        setError(result.error);
      } else {
        setOpen(false);
        setError(null);
      }
    });
  }

  const triggerEl = trigger ?? (
    <Button>Create Training Plan</Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={triggerEl as React.ReactElement} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Training Plan</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name">Plan Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g. Spring Marathon 2026"
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="race_type">Race Type</Label>
            <select
              id="race_type"
              name="race_type"
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">Select race type</option>
              {RACE_TYPES.map((rt) => (
                <option key={rt.value} value={rt.value}>
                  {rt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="race_date">Race Date (optional)</Label>
            <Input id="race_date" name="race_date" type="date" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="total_weeks">Total Weeks</Label>
            <Input
              id="total_weeks"
              name="total_weeks"
              type="number"
              min={1}
              max={52}
              defaultValue={12}
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {isPending && (
            <p className="text-sm text-muted-foreground text-center">
              Generating your training schedule — this may take a moment...
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Building Schedule..." : "Create Plan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
