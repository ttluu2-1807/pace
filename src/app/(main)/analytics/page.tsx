import { createClient } from "@/lib/supabase/server";
import { getWeeklyCheckin } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { VolumeChart } from "@/components/analytics/VolumeChart";
import { WeeklyCheckinForm } from "@/components/analytics/WeeklyCheckinForm";
import type { WeeklyVolumeEntry } from "@/components/analytics/VolumeChart";
import type { Workout } from "@/lib/types";

// Return the Monday of the week containing `date`
function getMondayOf(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatWeekLabel(monday: Date): string {
  return monday.toLocaleDateString("en-AU", { month: "short", day: "numeric" });
}

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const today = new Date();
  const thisMonday = getMondayOf(today);

  // Build 8 week boundaries (current week + 7 prior)
  const weekStarts: Date[] = [];
  for (let i = 7; i >= 0; i--) {
    const d = new Date(thisMonday);
    d.setDate(d.getDate() - i * 7);
    weekStarts.push(d);
  }

  // Earliest start (8 weeks ago Monday) to today for a single query
  const rangeStart = toDateString(weekStarts[0]);
  const rangeEnd = toDateString(today);

  // Month boundaries for monthly stats
  const monthStart = toDateString(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  const [{ data: workoutsRaw }, checkin] = await Promise.all([
    supabase
      .from("workouts")
      .select("*")
      .eq("user_id", user.id)
      .gte("date", rangeStart)
      .lte("date", rangeEnd)
      .order("date", { ascending: true }),
    getWeeklyCheckin(user.id, thisMonday),
  ]);

  const workouts: Workout[] = (workoutsRaw ?? []) as Workout[];

  // Build weekly volume chart data
  const weeklyVolume: WeeklyVolumeEntry[] = weekStarts.map((monday) => {
    const sundayStr = toDateString(
      new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000)
    );
    const mondayStr = toDateString(monday);
    const weekWorkouts = workouts.filter(
      (w) => w.date >= mondayStr && w.date <= sundayStr && w.completed
    );
    const km = weekWorkouts.reduce((sum, w) => sum + (w.actual_distance_km ?? w.distance_km ?? 0), 0);
    return { label: formatWeekLabel(monday), km: Math.round(km * 10) / 10 };
  });

  // Monthly stats
  const monthWorkouts = workouts.filter((w) => w.date >= monthStart);
  const completedThisMonth = monthWorkouts.filter((w) => w.completed);
  const totalDistanceMonth = completedThisMonth.reduce(
    (sum, w) => sum + (w.actual_distance_km ?? w.distance_km ?? 0),
    0
  );
  const completionRate =
    monthWorkouts.length > 0
      ? Math.round((completedThisMonth.length / monthWorkouts.length) * 100)
      : 0;

  // This week stats
  const thisWeekSunStr = toDateString(
    new Date(thisMonday.getTime() + 6 * 24 * 60 * 60 * 1000)
  );
  const thisMondayStr = toDateString(thisMonday);
  const thisWeekWorkouts = workouts.filter(
    (w) => w.date >= thisMondayStr && w.date <= thisWeekSunStr
  );
  const thisWeekKm = thisWeekWorkouts
    .filter((w) => w.completed)
    .reduce((sum, w) => sum + (w.actual_distance_km ?? w.distance_km ?? 0), 0);
  const thisWeekMinutes = thisWeekWorkouts
    .filter((w) => w.completed)
    .reduce(
      (sum, w) => sum + (w.actual_duration_minutes ?? w.duration_minutes ?? 0),
      0
    );

  const hours = Math.floor(thisWeekMinutes / 60);
  const mins = thisWeekMinutes % 60;
  const thisWeekTimeStr =
    thisWeekMinutes > 0
      ? hours > 0
        ? `${hours}h ${mins}m`
        : `${mins}m`
      : "0m";

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground text-sm">
          Your running intelligence
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">This Week</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {thisWeekWorkouts.filter((w) => w.completed).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No completed workouts this week yet.
            </p>
          ) : (
            <p className="text-sm">
              You&apos;ve run {Math.round(thisWeekKm * 10) / 10} km this week
              across {thisWeekWorkouts.filter((w) => w.completed).length}{" "}
              {thisWeekWorkouts.filter((w) => w.completed).length === 1
                ? "session"
                : "sessions"}
              .
            </p>
          )}
          <Separator />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Distance</p>
              <p className="text-lg font-bold">
                {Math.round(thisWeekKm * 10) / 10} km
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Time</p>
              <p className="text-lg font-bold">{thisWeekTimeStr}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Sessions</p>
              <p className="text-lg font-bold">
                {thisWeekWorkouts.filter((w) => w.completed).length} /{" "}
                {thisWeekWorkouts.length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            Weekly Volume — Last 8 Weeks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <VolumeChart data={weeklyVolume} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">This Month</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Workouts</p>
              <p className="text-lg font-bold">{completedThisMonth.length}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Distance</p>
              <p className="text-lg font-bold">
                {Math.round(totalDistanceMonth * 10) / 10} km
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Completion</p>
              <p className="text-lg font-bold">{completionRate}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            Weekly Check-in
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {checkin && (
            <div className="grid grid-cols-3 gap-4 pb-2">
              {checkin.sleep_score != null && (
                <div>
                  <p className="text-xs text-muted-foreground">Sleep</p>
                  <p className="text-lg font-bold">{checkin.sleep_score}/5</p>
                </div>
              )}
              {checkin.energy_level != null && (
                <div>
                  <p className="text-xs text-muted-foreground">Energy</p>
                  <p className="text-lg font-bold">{checkin.energy_level}/5</p>
                </div>
              )}
              {checkin.motivation_level != null && (
                <div>
                  <p className="text-xs text-muted-foreground">Motivation</p>
                  <p className="text-lg font-bold">
                    {checkin.motivation_level}/5
                  </p>
                </div>
              )}
              {checkin.hrv_score != null && (
                <div>
                  <p className="text-xs text-muted-foreground">HRV</p>
                  <p className="text-lg font-bold">{checkin.hrv_score}</p>
                </div>
              )}
            </div>
          )}
          {checkin && checkin.notes && (
            <>
              <Separator />
              <p className="text-sm text-muted-foreground">{checkin.notes}</p>
            </>
          )}
          <Separator />
          <WeeklyCheckinForm weekStart={thisMonday} existing={checkin} />
        </CardContent>
      </Card>
    </div>
  );
}
