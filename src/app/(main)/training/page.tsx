import { createClient } from "@/lib/supabase/server";
import { getActiveTrainingPlan, getWorkoutsForWeek, getWeeklyVolumes, getAllTrainingPlans } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CreatePlanModal } from "@/components/training/CreatePlanModal";
import { AddWorkoutModal } from "@/components/shared/AddWorkoutModal";
import { WeekNavigator } from "@/components/training/WeekNavigator";
import { WeeklyVolumeChart } from "@/components/training/WeeklyVolumeChart";
import { PlanStatusButtons } from "@/components/training/PlanStatusButtons";
import type { WorkoutType, PlanStatus } from "@/lib/types";

const WORKOUT_TYPE_LABELS: Record<WorkoutType, string> = {
  easy: "Easy Run",
  long: "Long Run",
  tempo: "Tempo Run",
  interval: "Intervals",
  strides: "Strides",
  "hill-repeats": "Hill Repeats",
  "cross-training": "Cross Training",
  "recovery-walk": "Recovery Walk",
  rest: "Rest",
};

const PHASE_LABELS: Record<string, string> = {
  base: "Base Phase",
  build: "Build Phase",
  peak: "Peak Phase",
  taper: "Taper Phase",
  recovery: "Recovery Phase",
};

const RACE_TYPE_LABELS: Record<string, string> = {
  "5k": "5K",
  "10k": "10K",
  "half-marathon": "Half Marathon",
  marathon: "Marathon",
  general: "General Fitness",
};

const SHORT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function getMondayOf(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function parseWeekParam(param: string | undefined): Date {
  if (!param) return getMondayOf(new Date());
  // Expect YYYY-MM-DD
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(param);
  if (!match) return getMondayOf(new Date());
  const parsed = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (isNaN(parsed.getTime())) return getMondayOf(new Date());
  // Ensure it's a Monday
  return getMondayOf(parsed);
}

export default async function TrainingPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const resolvedParams = await searchParams;
  const weekParam = Array.isArray(resolvedParams.week)
    ? resolvedParams.week[0]
    : resolvedParams.week;

  const weekDate = parseWeekParam(weekParam);
  const currentWeekStart = getMondayOf(new Date());

  const [plan, weekWorkouts, allPlans] = await Promise.all([
    getActiveTrainingPlan(user.id),
    getWorkoutsForWeek(user.id, weekDate),
    getAllTrainingPlans(user.id),
  ]);

  const weeklyVolumes = plan
    ? await getWeeklyVolumes(user.id, plan.created_at, plan.total_weeks)
    : [];

  // Past/paused plans (everything not currently active)
  const inactivePlans = allPlans.filter((p) => !p.active);

  const isCurrentWeek =
    weekDate.getFullYear() === currentWeekStart.getFullYear() &&
    weekDate.getMonth() === currentWeekStart.getMonth() &&
    weekDate.getDate() === currentWeekStart.getDate();

  if (!plan) {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Training Plan</h1>
            <p className="text-muted-foreground text-sm">
              No active training plan
            </p>
          </div>
          <AddWorkoutModal
            userId={user.id}
            trigger={
              <Button variant="outline" size="sm">
                Add Workout
              </Button>
            }
          />
        </div>
        <WeekNavigator currentWeekStart={weekDate} />
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <p className="text-muted-foreground">
              You don&apos;t have an active training plan yet.
            </p>
            <CreatePlanModal />
          </CardContent>
        </Card>
      </div>
    );
  }

  const progressPercent = Math.round((plan.current_week / plan.total_weeks) * 100);
  const raceTypeLabel = plan.race_type ? RACE_TYPE_LABELS[plan.race_type] ?? plan.race_type : "General";
  const phaseLabel = PHASE_LABELS[plan.current_phase] ?? plan.current_phase;

  const raceDateLabel = plan.race_date
    ? new Date(plan.race_date).toLocaleDateString("en-AU", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  // Calculate which plan week the selected calendar week corresponds to
  const weekDiffMs = weekDate.getTime() - currentWeekStart.getTime();
  const weekDiff = Math.round(weekDiffMs / (7 * 24 * 60 * 60 * 1000));
  const planWeekNumber = plan.current_week + weekDiff;
  const showPlanWeek =
    !isCurrentWeek &&
    planWeekNumber >= 1 &&
    planWeekNumber <= plan.total_weeks;

  // Week heading
  const weekHeading = isCurrentWeek
    ? "This Week's Sessions"
    : `Week of ${weekDate.getDate()} ${SHORT_MONTHS[weekDate.getMonth()]}`;

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{plan.name}</h1>
          <p className="text-muted-foreground text-sm">
            {raceTypeLabel} — {phaseLabel}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AddWorkoutModal
            userId={user.id}
            trigger={
              <Button variant="outline" size="sm">
                Add Workout
              </Button>
            }
          />
          <CreatePlanModal trigger={<Button variant="outline" size="sm">New Plan</Button>} />
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Plan Progress</CardTitle>
            <Badge>
              Week {plan.current_week} of {plan.total_weeks}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Progress value={progressPercent} />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{phaseLabel}</span>
            {raceDateLabel && <span>Race Day: {raceDateLabel}</span>}
          </div>
          <PlanStatusButtons
            planId={plan.id}
            currentStatus={(plan.status ?? "active") as PlanStatus}
          />
        </CardContent>
      </Card>

      {/* Weekly volume overview chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Weekly Volume</CardTitle>
        </CardHeader>
        <CardContent>
          <WeeklyVolumeChart data={weeklyVolumes} currentWeek={plan.current_week} />
        </CardContent>
      </Card>

      <WeekNavigator currentWeekStart={weekDate} />

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold">{weekHeading}</h2>
          {showPlanWeek && (
            <Badge variant="outline" className="text-xs">
              Plan Week {planWeekNumber} of {plan.total_weeks}
            </Badge>
          )}
        </div>
        {weekWorkouts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No workouts scheduled for this week.
          </p>
        ) : (
          weekWorkouts.map((workout) => {
            const dayName = DAY_NAMES[new Date(workout.date + "T00:00:00").getDay()];
            const typeLabel = WORKOUT_TYPE_LABELS[workout.type] ?? workout.type;

            return (
              <Card
                key={workout.id}
                className={workout.completed ? "opacity-60" : ""}
              >
                <CardContent className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-sm">{dayName}</p>
                    <p className="text-muted-foreground text-sm">
                      {workout.title || typeLabel}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">
                      {workout.type === "rest"
                        ? "—"
                        : `${workout.duration_minutes} min`}
                      {workout.distance_km
                        ? ` · ${workout.distance_km} km`
                        : ""}
                    </p>
                    {workout.completed && (
                      <Badge variant="secondary" className="text-xs">
                        Done
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* ── Plan History ── */}
      {inactivePlans.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Plan History
          </h2>
          {inactivePlans.map((p) => {
            const status = (p.status ?? "completed") as PlanStatus;
            const raceLabel = p.race_type ? RACE_TYPE_LABELS[p.race_type] ?? p.race_type : "General";
            const createdDate = new Date(p.created_at).toLocaleDateString("en-AU", {
              month: "short",
              year: "numeric",
            });
            const statusColour: Record<PlanStatus, string> = {
              active: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
              paused: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
              completed: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
              archived: "bg-muted text-muted-foreground",
            };

            return (
              <Card key={p.id} className="opacity-75">
                <CardContent className="flex items-center justify-between py-3 gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {raceLabel} &middot; {p.total_weeks}w &middot; Started {createdDate}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColour[status]}`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                    <PlanStatusButtons planId={p.id} currentStatus={status} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
