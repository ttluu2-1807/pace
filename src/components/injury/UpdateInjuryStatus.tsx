"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { changeInjuryStatus } from "@/app/(main)/injury/actions";
import type { InjuryStatus } from "@/lib/types";

const SELECT_CLASS =
  "h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const STATUS_OPTIONS: { value: InjuryStatus; label: string }[] = [
  { value: "current", label: "Current" },
  { value: "recovering", label: "Recovering" },
  { value: "historical", label: "Historical" },
];

interface Props {
  injuryId: string;
  currentStatus: InjuryStatus;
}

export function UpdateInjuryStatus({ injuryId, currentStatus }: Props) {
  const [status, setStatus] = useState<InjuryStatus>(currentStatus);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleUpdate() {
    if (status === currentStatus) return;
    startTransition(async () => {
      const result = await changeInjuryStatus(injuryId, status);
      if (result.error) {
        setError(result.error);
        setStatus(currentStatus);
      } else {
        setError(null);
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value as InjuryStatus)}
        className={SELECT_CLASS}
        disabled={isPending}
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <Button
        size="sm"
        variant="outline"
        onClick={handleUpdate}
        disabled={isPending || status === currentStatus}
      >
        {isPending ? "Saving..." : "Update"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
