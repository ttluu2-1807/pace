"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  getRecommendedPhaseIndex,
  type InjuryProtocol,
  type ReturnToRunEstimate,
} from "@/lib/injury-intelligence";
import type { InjurySeverity, InjuryStatus } from "@/lib/types";

interface Props {
  protocol: InjuryProtocol;
  severity: InjurySeverity;
  status: InjuryStatus;
  returnEstimate: ReturnToRunEstimate;
}

export function InjuryProtocolCard({
  protocol,
  severity,
  status,
  returnEstimate,
}: Props) {
  const [exercisesOpen, setExercisesOpen] = useState(false);
  const [checkedCriteria, setCheckedCriteria] = useState<
    Record<number, boolean>
  >({});

  const phaseIndex = getRecommendedPhaseIndex(
    severity,
    status as "current" | "recovering" | "historical",
    protocol.phases
  );
  const currentPhase = protocol.phases[phaseIndex];

  function toggleCriterion(index: number) {
    setCheckedCriteria((prev) => ({ ...prev, [index]: !prev[index] }));
  }

  const completedCount = Object.values(checkedCriteria).filter(Boolean).length;
  const totalCriteria = protocol.returnToRunCriteria.length;
  const progressPercent = Math.round((completedCount / totalCriteria) * 100);

  return (
    <div className="space-y-3">
      {/* ── Protocol Overview ── */}
      <p className="text-xs text-muted-foreground leading-relaxed">
        {protocol.overview}
      </p>

      {/* ── Return-to-Run Estimate ── */}
      <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 space-y-0.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-foreground">
            Expected return to running
          </span>
          <span className="text-xs font-semibold text-foreground">
            {returnEstimate.label}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {returnEstimate.confidence}
        </p>
      </div>

      {/* ── Current Rehab Phase ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground">
            {currentPhase.phase}
          </span>
          <Badge variant="outline" className="text-xs">
            {currentPhase.durationDays}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{currentPhase.goal}</p>
        <div className="rounded-md bg-muted/40 px-3 py-2">
          <p className="text-xs font-medium mb-0.5">Running guidance</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {currentPhase.runningGuidance}
          </p>
        </div>
      </div>

      {/* ── Rehab Exercises (expandable) ── */}
      <div>
        <button
          type="button"
          onClick={() => setExercisesOpen((v) => !v)}
          className="flex items-center gap-1.5 text-xs font-medium text-foreground hover:text-foreground/80 transition-colors"
        >
          <span
            className="inline-block transition-transform"
            style={{
              transform: exercisesOpen ? "rotate(90deg)" : "rotate(0deg)",
            }}
          >
            ▶
          </span>
          {exercisesOpen ? "Hide rehab exercises" : "Show rehab exercises"}
          <span className="text-muted-foreground">
            ({currentPhase.exercises.length})
          </span>
        </button>

        {exercisesOpen && (
          <div className="mt-2 space-y-2">
            {currentPhase.exercises.map((ex, i) => (
              <div
                key={i}
                className="rounded-md border border-border px-3 py-2.5 space-y-1"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-medium text-foreground">
                    {ex.name}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {ex.frequency}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{ex.sets}</p>
                <p className="text-xs italic text-muted-foreground">
                  Cue: {ex.cue}
                </p>
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Progress when: </span>
                  {ex.progressionNote}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* ── Return-to-Run Checklist ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold">
            Return-to-run checklist
          </span>
          <span className="text-xs text-muted-foreground">
            {completedCount}/{totalCriteria}
            {progressPercent === 100 && (
              <span className="ml-1 text-green-600 font-medium">Ready!</span>
            )}
          </span>
        </div>
        <div className="space-y-1.5">
          {protocol.returnToRunCriteria.map((criterion, i) => (
            <label
              key={i}
              className="flex items-start gap-2.5 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={!!checkedCriteria[i]}
                onChange={() => toggleCriterion(i)}
                className="mt-0.5 rounded shrink-0 cursor-pointer"
              />
              <span
                className={`text-xs leading-relaxed transition-colors ${
                  checkedCriteria[i]
                    ? "line-through text-muted-foreground"
                    : "text-foreground"
                }`}
              >
                {criterion}
              </span>
            </label>
          ))}
        </div>
        {progressPercent === 100 && (
          <p className="text-xs text-green-600 font-medium mt-1">
            All criteria met — you may be ready to return to running. Confirm with a physiotherapist.
          </p>
        )}
      </div>

      <Separator />

      {/* ── Nutrition Focus ── */}
      <div className="space-y-1.5">
        <span className="text-xs font-semibold">Nutrition for recovery</span>
        <ul className="space-y-1">
          {protocol.nutritionFocus.slice(0, 3).map((tip, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
              <span className="mt-0.5 shrink-0 text-foreground/60">•</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Red Flags ── */}
      {protocol.redFlagSymptoms.length > 0 && (
        <>
          <Separator />
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5 space-y-1.5">
            <p className="text-xs font-semibold text-destructive">
              See a doctor if you experience any of the following
            </p>
            <ul className="space-y-1">
              {protocol.redFlagSymptoms.map((flag, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-xs text-destructive/80"
                >
                  <span className="mt-0.5 shrink-0">!</span>
                  <span>{flag}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {/* ── Phase Red Flags ── */}
      {currentPhase.redFlags.length > 0 && (
        <div className="rounded-md border border-amber-500/30 bg-amber-50/50 dark:bg-amber-900/10 px-3 py-2.5 space-y-1.5">
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
            Stop activity and reassess if you notice
          </p>
          <ul className="space-y-1">
            {currentPhase.redFlags.map((flag, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-xs text-amber-700/80 dark:text-amber-400/80"
              >
                <span className="mt-0.5 shrink-0">!</span>
                <span>{flag}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
