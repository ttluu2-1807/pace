"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { FuellingPlan, FuelOption } from "@/lib/nutrition-intelligence";

interface Props {
  fuellingPlan: FuellingPlan;
  workoutCompleted: boolean;
}

function FuelOptionList({ options }: { options: FuelOption[] }) {
  return (
    <ul className="space-y-2 mt-2">
      {options.map((opt, i) => (
        <li
          key={i}
          className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm"
        >
          <div className="flex items-start justify-between gap-2">
            <span className="font-medium">{opt.meal}</span>
            <Badge variant="outline" className="shrink-0 text-xs">
              {opt.carbsG}g carbs
            </Badge>
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
            <span>Prep: {opt.prepTime}</span>
            {opt.note && (
              <>
                <span>&middot;</span>
                <span>{opt.note}</span>
              </>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function FuellingCard({ fuellingPlan, workoutCompleted }: Props) {
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [showNoTime, setShowNoTime] = useState(false);
  const [showRecoveryAlts, setShowRecoveryAlts] = useState(false);
  const [showRecoveryNoTime, setShowRecoveryNoTime] = useState(false);

  const { preRun, duringRun, postRun } = fuellingPlan;

  return (
    <div className="space-y-4">
      {/* Pre-run section */}
      {preRun && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Pre-Run Fuelling</CardTitle>
              <Badge variant="secondary" className="text-xs">
                {preRun.timing}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Primary meal */}
            <div className="rounded-lg border border-border bg-muted/40 px-3 py-3">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-sm">{preRun.meal}</p>
                <Badge variant="outline" className="shrink-0 text-xs">
                  ~{preRun.carbsG}g carbs
                </Badge>
              </div>
            </div>

            {/* Why */}
            <p className="text-xs text-muted-foreground leading-relaxed">
              {preRun.why}
            </p>

            {/* During run */}
            {duringRun && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                <span className="font-medium">During run: </span>
                {duringRun}
              </div>
            )}

            <Separator />

            {/* Toggle buttons */}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowAlternatives((v) => !v);
                  if (!showAlternatives) setShowNoTime(false);
                }}
              >
                {showAlternatives ? "Hide alternatives" : "Show alternatives"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowNoTime((v) => !v);
                  if (!showNoTime) setShowAlternatives(false);
                }}
              >
                {showNoTime ? "Hide quick options" : "No time?"}
              </Button>
            </div>

            {/* Alternatives */}
            {showAlternatives && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Alternatives
                </p>
                <FuelOptionList options={preRun.alternatives} />
              </div>
            )}

            {/* No time options */}
            {showNoTime && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Quick options (&lt;5 min)
                </p>
                <FuelOptionList options={preRun.noTimeOptions} />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Post-run recovery section — only shown after workout is completed */}
      {workoutCompleted && (
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recovery Window</CardTitle>
              <Badge
                variant="secondary"
                className="text-xs bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
              >
                Within {postRun.windowMinutes > 0 ? `${postRun.windowMinutes} min` : "today"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Session logged confirmation */}
            <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-800 dark:bg-green-950/40 dark:border-green-800 dark:text-green-300">
              <span className="text-base">&#10003;</span>
              <span className="font-medium">Session logged</span>
            </div>

            {/* Primary recovery meal */}
            <div className="rounded-lg border border-border bg-muted/40 px-3 py-3">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="font-medium text-sm">{postRun.meal}</p>
              </div>
              <div className="flex gap-3 text-xs text-muted-foreground">
                <span>{postRun.proteinG}g protein</span>
                <span>&middot;</span>
                <span>{postRun.carbsG}g carbs</span>
              </div>
            </div>

            {/* Why */}
            <p className="text-xs text-muted-foreground leading-relaxed">
              {postRun.why}
            </p>

            <Separator />

            {/* Toggle buttons */}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowRecoveryAlts((v) => !v);
                  if (!showRecoveryAlts) setShowRecoveryNoTime(false);
                }}
              >
                {showRecoveryAlts ? "Hide alternatives" : "Show alternatives"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowRecoveryNoTime((v) => !v);
                  if (!showRecoveryNoTime) setShowRecoveryAlts(false);
                }}
              >
                {showRecoveryNoTime ? "Hide quick options" : "No time?"}
              </Button>
            </div>

            {showRecoveryAlts && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Alternatives
                </p>
                <FuelOptionList options={postRun.alternatives} />
              </div>
            )}

            {showRecoveryNoTime && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Quick options
                </p>
                <FuelOptionList options={postRun.noTimeOptions} />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
