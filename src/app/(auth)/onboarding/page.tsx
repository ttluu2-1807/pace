"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { completeOnboarding } from "../actions";

type Sex = "male" | "female" | "other";
type PrimaryGoal = "health" | "race" | "weight" | "return-from-injury";
type DepthPreference = "simple" | "balanced" | "full";
type CoachingVoice = "encouraging" | "clinical" | "direct" | "balanced";

interface OnboardingState {
  name: string;
  age: string;
  sex: Sex;
  weight_kg: string;
  height_cm: string;
  weekly_run_frequency: string;
  longest_recent_run_km: string;
  primary_goal: PrimaryGoal;
  depth_preference: DepthPreference;
  coaching_voice: CoachingVoice;
}

const TOTAL_STEPS = 4;

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<OnboardingState>({
    name: "",
    age: "",
    sex: "male",
    weight_kg: "",
    height_cm: "",
    weekly_run_frequency: "",
    longest_recent_run_km: "",
    primary_goal: "health",
    depth_preference: "balanced",
    coaching_voice: "balanced",
  });

  function set<K extends keyof OnboardingState>(key: K, value: OnboardingState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const isStep1Valid =
    form.name.trim().length > 0 &&
    form.age.trim().length > 0 &&
    form.sex.length > 0;

  const isStep2Valid =
    form.weight_kg.trim().length > 0 && form.height_cm.trim().length > 0;

  const isStep3Valid =
    form.weekly_run_frequency.trim().length > 0 &&
    form.longest_recent_run_km.trim().length > 0;

  function canAdvance() {
    if (step === 1) return isStep1Valid;
    if (step === 2) return isStep2Valid;
    if (step === 3) return isStep3Valid;
    return true;
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">
              Step {step} of {TOTAL_STEPS}
            </span>
            <span className="text-xs text-muted-foreground">
              {Math.round((step / TOTAL_STEPS) * 100)}%
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            />
          </div>
          <CardTitle className="text-xl mt-3">
            {step === 1 && "Tell us about yourself"}
            {step === 2 && "Body measurements"}
            {step === 3 && "Your running background"}
            {step === 4 && "Personalise your coaching"}
          </CardTitle>
        </CardHeader>

        <CardContent>
          {/* Hidden form that wraps everything so server action can read it */}
          <form action={completeOnboarding} id="onboarding-form">
            {/* Always-present hidden fields so FormData has all values */}
            <input type="hidden" name="name" value={form.name} />
            <input type="hidden" name="age" value={form.age} />
            <input type="hidden" name="sex" value={form.sex} />
            <input type="hidden" name="weight_kg" value={form.weight_kg} />
            <input type="hidden" name="height_cm" value={form.height_cm} />
            <input
              type="hidden"
              name="weekly_run_frequency"
              value={form.weekly_run_frequency}
            />
            <input
              type="hidden"
              name="longest_recent_run_km"
              value={form.longest_recent_run_km}
            />
            <input
              type="hidden"
              name="primary_goal"
              value={form.primary_goal}
            />
            <input
              type="hidden"
              name="depth_preference"
              value={form.depth_preference}
            />
            <input
              type="hidden"
              name="coaching_voice"
              value={form.coaching_voice}
            />
          </form>

          {/* Step 1: Personal info */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  placeholder="Your name"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="e.g. 32"
                  min={10}
                  max={100}
                  value={form.age}
                  onChange={(e) => set("age", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Sex</Label>
                <div className="flex gap-2">
                  {(["male", "female", "other"] as Sex[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => set("sex", s)}
                      className={`flex-1 py-2 rounded-md text-sm border transition-colors ${
                        form.sex === s
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-input hover:bg-accent"
                      }`}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Body measurements */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="weight_kg">Weight (kg)</Label>
                <Input
                  id="weight_kg"
                  type="number"
                  placeholder="e.g. 70"
                  min={30}
                  max={300}
                  step={0.1}
                  value={form.weight_kg}
                  onChange={(e) => set("weight_kg", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height_cm">Height (cm)</Label>
                <Input
                  id="height_cm"
                  type="number"
                  placeholder="e.g. 175"
                  min={100}
                  max={250}
                  value={form.height_cm}
                  onChange={(e) => set("height_cm", e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {/* Step 3: Running background */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="weekly_run_frequency">
                  How many days per week do you run?
                </Label>
                <Input
                  id="weekly_run_frequency"
                  type="number"
                  placeholder="e.g. 4"
                  min={1}
                  max={7}
                  value={form.weekly_run_frequency}
                  onChange={(e) => set("weekly_run_frequency", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longest_recent_run_km">
                  Longest run in the past 6 weeks (km)
                </Label>
                <Input
                  id="longest_recent_run_km"
                  type="number"
                  placeholder="e.g. 15"
                  min={0}
                  max={300}
                  step={0.1}
                  value={form.longest_recent_run_km}
                  onChange={(e) =>
                    set("longest_recent_run_km", e.target.value)
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Primary goal</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { value: "health", label: "General health" },
                      { value: "race", label: "Race training" },
                      { value: "weight", label: "Weight management" },
                      { value: "return-from-injury", label: "Return from injury" },
                    ] as { value: PrimaryGoal; label: string }[]
                  ).map((g) => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => set("primary_goal", g.value)}
                      className={`py-2 px-3 rounded-md text-sm border text-left transition-colors ${
                        form.primary_goal === g.value
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-input hover:bg-accent"
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Coaching preferences */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label>Detail level</Label>
                <p className="text-xs text-muted-foreground">
                  How much information do you want in your daily brief?
                </p>
                <div className="flex gap-2">
                  {(
                    [
                      { value: "simple", label: "Simple" },
                      { value: "balanced", label: "Balanced" },
                      { value: "full", label: "Full" },
                    ] as { value: DepthPreference; label: string }[]
                  ).map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => set("depth_preference", d.value)}
                      className={`flex-1 py-2 rounded-md text-sm border transition-colors ${
                        form.depth_preference === d.value
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-input hover:bg-accent"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Coaching voice</Label>
                <p className="text-xs text-muted-foreground">
                  What tone would you like your coach to use?
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { value: "encouraging", label: "Encouraging" },
                      { value: "clinical", label: "Clinical" },
                      { value: "direct", label: "Direct" },
                      { value: "balanced", label: "Balanced" },
                    ] as { value: CoachingVoice; label: string }[]
                  ).map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => set("coaching_voice", c.value)}
                      className={`py-2 px-3 rounded-md text-sm border transition-colors ${
                        form.coaching_voice === c.value
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-input hover:bg-accent"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setStep((s) => s - 1)}
              >
                Back
              </Button>
            )}

            {step < TOTAL_STEPS ? (
              <Button
                type="button"
                className="flex-1"
                disabled={!canAdvance()}
                onClick={() => setStep((s) => s + 1)}
              >
                Continue
              </Button>
            ) : (
              <Button
                type="submit"
                form="onboarding-form"
                className="flex-1"
              >
                Start Running
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
