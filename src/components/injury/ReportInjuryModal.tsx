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
import { reportInjury } from "@/app/(main)/injury/actions";
import type {
  BodyRegion,
  InjurySeverity,
  InjuryStatus,
  OnsetType,
} from "@/lib/types";

const SELECT_CLASS =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function ReportInjuryModal() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const body_region = fd.get("body_region") as BodyRegion;
    const condition = (fd.get("condition") as string).trim();
    const severity = fd.get("severity") as InjurySeverity;
    const status = fd.get("status") as InjuryStatus;
    const onset_type = fd.get("onset_type") as OnsetType;
    const notes = (fd.get("notes") as string).trim() || undefined;

    if (!condition) {
      setError("Condition description is required.");
      return;
    }

    startTransition(async () => {
      const result = await reportInjury({
        body_region,
        condition,
        severity,
        status,
        onset_type,
        notes,
      });

      if (result.error) {
        setError(result.error);
      } else {
        setOpen(false);
        setError(null);
        formRef.current?.reset();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button>Report Issue</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report Injury / Issue</DialogTitle>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="body_region">Body Region</Label>
            <select
              id="body_region"
              name="body_region"
              className={SELECT_CLASS}
              defaultValue="foot-ankle"
              required
            >
              <option value="foot-ankle">Foot / Ankle</option>
              <option value="lower-leg">Lower Leg (shin / calf)</option>
              <option value="knee">Knee</option>
              <option value="hip-glute">Hip / Glute</option>
              <option value="lower-back">Lower Back</option>
              <option value="upper-body">Upper Body</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="condition">Condition / Description</Label>
            <Input
              id="condition"
              name="condition"
              placeholder="e.g. Achilles tendinopathy"
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="severity">Severity</Label>
            <select
              id="severity"
              name="severity"
              className={SELECT_CLASS}
              defaultValue="monitoring"
              required
            >
              <option value="monitoring">Monitoring</option>
              <option value="mild">Mild</option>
              <option value="moderate">Moderate</option>
              <option value="severe">Severe</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              className={SELECT_CLASS}
              defaultValue="current"
              required
            >
              <option value="current">Current</option>
              <option value="recovering">Recovering</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="onset_type">Onset Type</Label>
            <select
              id="onset_type"
              name="onset_type"
              className={SELECT_CLASS}
              defaultValue="gradual"
              required
            >
              <option value="gradual">Gradual</option>
              <option value="acute">Acute</option>
              <option value="post-surgery">Post-Surgery</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Any additional context..."
              rows={3}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Saving..." : "Report Issue"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
