import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import PreferencesForm from "./PreferencesForm";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch profile and Strava connection concurrently
  const [profile, stravaResult] = await Promise.all([
    getProfile(user.id),
    supabase
      .from("strava_connections")
      .select("athlete_name")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const stravaConnected = !!stravaResult.data;
  const stravaAthlete = stravaResult.data?.athlete_name;

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

      {/* Integrations */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">Integrations</CardTitle>
          <Link
            href="/settings/integrations"
            className="text-xs text-primary hover:underline"
          >
            Manage →
          </Link>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Strava */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-[#FC4C02] flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white">
                  <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                </svg>
              </div>
              <span className="text-sm">Strava</span>
            </div>
            {stravaConnected ? (
              <Badge variant="secondary" className="text-xs">
                {stravaAthlete ?? "Connected"}
              </Badge>
            ) : (
              <Link
                href="/settings/integrations"
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-1 text-xs font-medium hover:bg-accent"
              >
                Connect
              </Link>
            )}
          </div>
          {/* Apple Health */}
          <div className="flex items-center justify-between opacity-50">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-red-500 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
              </div>
              <span className="text-sm">Apple Health</span>
            </div>
            <span className="text-xs text-muted-foreground">Coming soon</span>
          </div>
          {/* Garmin */}
          <div className="flex items-center justify-between opacity-50">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-[#009CDE] flex items-center justify-center text-white text-[9px] font-bold">G</div>
              <span className="text-sm">Garmin Connect</span>
            </div>
            <span className="text-xs text-muted-foreground">Coming soon</span>
          </div>
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
