"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { pausePlanAction, completePlanAction, reactivatePlanAction } from "@/app/(main)/training/actions";
import type { PlanStatus } from "@/lib/types";

interface Props {
  planId: string;
  currentStatus: PlanStatus;
}

export function PlanStatusButtons({ planId, currentStatus }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleAction(action: () => Promise<{ error?: string }>) {
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        setError(result.error);
      } else {
        setError(null);
        router.refresh();
      }
    });
  }

  if (currentStatus === "active") {
    return (
      <div className="flex gap-2 flex-wrap">
        {error && <p className="w-full text-xs text-destructive">{error}</p>}
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => handleAction(() => pausePlanAction(planId))}
        >
          Pause Plan
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => handleAction(() => completePlanAction(planId))}
        >
          Mark Complete
        </Button>
      </div>
    );
  }

  if (currentStatus === "paused" || currentStatus === "completed") {
    return (
      <div className="flex gap-2 flex-wrap">
        {error && <p className="w-full text-xs text-destructive">{error}</p>}
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => handleAction(() => reactivatePlanAction(planId))}
        >
          Reactivate Plan
        </Button>
      </div>
    );
  }

  return null;
}
