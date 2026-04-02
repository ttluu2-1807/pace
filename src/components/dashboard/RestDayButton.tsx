"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { markRestDay } from "@/app/(main)/dashboard/actions";

interface Props {
  workoutId: string;
}

export function RestDayButton({ workoutId }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      await markRestDay(workoutId);
    });
  }

  return (
    <Button variant="ghost" onClick={handleClick} disabled={isPending}>
      {isPending ? "Saving..." : "Rest Day"}
    </Button>
  );
}
