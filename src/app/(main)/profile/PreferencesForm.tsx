"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { updateProfilePreferences } from "@/app/(auth)/actions";
import type { DepthPreference, CoachingVoice } from "@/lib/types";

interface PreferencesFormProps {
  depthPreference: DepthPreference;
  coachingVoice: CoachingVoice;
}

const DEPTH_OPTIONS: { value: DepthPreference; label: string }[] = [
  { value: "simple", label: "Simple" },
  { value: "balanced", label: "Balanced" },
  { value: "full", label: "Full" },
];

const COACHING_OPTIONS: { value: CoachingVoice; label: string }[] = [
  { value: "encouraging", label: "Encouraging" },
  { value: "clinical", label: "Clinical" },
  { value: "direct", label: "Direct" },
  { value: "balanced", label: "Balanced" },
];

export default function PreferencesForm({
  depthPreference,
  coachingVoice,
}: PreferencesFormProps) {
  async function handleDepthChange(value: DepthPreference) {
    const fd = new FormData();
    fd.append("depth_preference", value);
    await updateProfilePreferences(fd);
  }

  async function handleCoachingChange(value: CoachingVoice) {
    const fd = new FormData();
    fd.append("coaching_voice", value);
    await updateProfilePreferences(fd);
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm">Detail Level</Label>
          <div className="flex gap-2">
            {DEPTH_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleDepthChange(opt.value)}
                className={`flex-1 py-1.5 rounded-md text-xs border transition-colors ${
                  depthPreference === opt.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-input hover:bg-accent"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label className="text-sm">Coaching Style</Label>
          <div className="grid grid-cols-2 gap-2">
            {COACHING_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleCoachingChange(opt.value)}
                className={`py-1.5 rounded-md text-xs border transition-colors ${
                  coachingVoice === opt.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-input hover:bg-accent"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <Label className="text-sm text-muted-foreground">
            Current preference
          </Label>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs capitalize">
              {depthPreference}
            </Badge>
            <Badge variant="outline" className="text-xs capitalize">
              {coachingVoice}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
