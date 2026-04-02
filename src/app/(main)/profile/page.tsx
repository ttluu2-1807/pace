import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/db";
import { redirect } from "next/navigation";
import PreferencesForm from "./PreferencesForm";
import type { Integration } from "@/lib/types";

// Integration display config
const INTEGRATION_DISPLAY: { type: Integration["type"]; name: string }[] = [
  { type: "apple-health", name: "Apple Health" },
  { type: "garmin", name: "Garmin Connect" },
  { type: "strava", name: "Strava" },
  { type: "mfp", name: "MyFitnessPal" },
];

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch profile and integrations concurrently
  const [profile, integrationsResult] = await Promise.all([
    getProfile(user.id),
    supabase
      .from("integrations")
      .select("*")
      .eq("user_id", user.id),
  ]);

  const integrations = (integrationsResult.data ?? []) as Integration[];

  // Map integration type -> connected status from DB
  function isConnected(type: Integration["type"]): boolean {
    return integrations.some((i) => i.type === type && i.connected);
  }

  const displayName = profile?.name ?? user.email ?? "Runner";
  const displayAge = profile?.age ? `, ${profile.age}` : "";

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground text-sm">
            {displayName}{displayAge}
          </p>
        </div>
        {profile?.is_pro && <Badge>Pro</Badge>}
      </div>

      {/* Quick Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Training Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">
                {profile?.weekly_run_frequency ?? "—"}
              </p>
              <p className="text-xs text-muted-foreground">runs/week</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {profile?.longest_recent_run_km ?? "—"}
              </p>
              <p className="text-xs text-muted-foreground">longest run km</p>
            </div>
            <div>
              <p className="text-2xl font-bold capitalize">
                {profile?.primary_goal
                  ? profile.primary_goal === "return-from-injury"
                    ? "Rehab"
                    : profile.primary_goal
                  : "—"}
              </p>
              <p className="text-xs text-muted-foreground">goal</p>
            </div>
          </div>

          {profile && (
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-muted-foreground">
              <span>
                Height:{" "}
                <span className="font-medium text-foreground">
                  {profile.height_cm} cm
                </span>
              </span>
              <span>
                Weight:{" "}
                <span className="font-medium text-foreground">
                  {profile.weight_kg} kg
                </span>
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Integrations — UI only, state from DB */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Integrations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {INTEGRATION_DISPLAY.map((integration) => {
            const connected = isConnected(integration.type);
            return (
              <div
                key={integration.type}
                className="flex items-center justify-between"
              >
                <span className="text-sm">{integration.name}</span>
                {connected ? (
                  <Badge variant="secondary" className="text-xs">
                    Connected
                  </Badge>
                ) : (
                  <Button variant="outline" size="sm" disabled>
                    Connect
                  </Button>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Preferences — interactive client component */}
      {profile && (
        <PreferencesForm
          depthPreference={profile.depth_preference}
          coachingVoice={profile.coaching_voice}
        />
      )}

      {!profile && (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            Complete onboarding to set your preferences.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
