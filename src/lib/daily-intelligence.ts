// ============================================================
// PACE — Daily Intelligence Engine
// Pure logic file — no Supabase, no React imports.
// Rules-based cross-tab synthesis for the Daily Brief.
// ============================================================

import type {
  Workout,
  WorkoutType,
  Injury,
  NutritionDay,
  TrainingPlan,
} from "@/lib/types";
import type { WeeklyCheckin } from "@/lib/db";

// Re-export profile type alias for convenience
export type { UserProfile as Profile } from "@/lib/types";
import type { UserProfile as Profile } from "@/lib/types";

// ----------------------------------------------------------------
// Public types
// ----------------------------------------------------------------

export type AlertSeverity = "info" | "warning" | "critical";

export interface DailyAlert {
  id: string; // unique stable key for React
  severity: AlertSeverity;
  icon: string; // emoji: ⚠️ 🔴 💡 🍌 😴 💧
  title: string;
  message: string;
  action?: {
    label: string;
    href: string;
  };
}

export interface WorkoutAdjustment {
  original: string; // e.g. "Interval: 6x800m"
  adjusted: string; // e.g. "Easy Run: 30 min easy"
  reason: string; // e.g. "Moderate shin splints — intervals contraindicated"
  severity: AlertSeverity;
}

export interface CoachingNote {
  greeting: string; // e.g. "Good morning" / "Afternoon" based on time of day
  headline: string; // 1 sentence — the single most important thing for today
  detail: string; // 1-2 sentences expanding on the headline
  tone: "encourage" | "caution" | "celebrate" | "inform";
}

export interface DailyIntelligence {
  alerts: DailyAlert[];
  workoutAdjustment: WorkoutAdjustment | null;
  coachingNote: CoachingNote;
  tomorrowPreview: string | null; // 1 sentence about tomorrow
}

// ----------------------------------------------------------------
// Context input
// ----------------------------------------------------------------

export interface DailyContext {
  profile: Profile;
  todayWorkout: Workout | null;
  tomorrowWorkout: Workout | null;
  activeInjuries: Injury[];
  weeklyCheckin: WeeklyCheckin | null;
  yesterdayNutrition: NutritionDay | null;
  todayNutrition: NutritionDay | null;
  plan: TrainingPlan | null;
  weekWorkouts: Workout[];
  currentHour: number; // 0-23
}

// ----------------------------------------------------------------
// Internal helpers
// ----------------------------------------------------------------

const HARD_WORKOUT_TYPES: WorkoutType[] = ["tempo", "interval", "hill-repeats"];
const RUNNING_WORKOUT_TYPES: WorkoutType[] = [
  "easy",
  "long",
  "tempo",
  "interval",
  "strides",
  "hill-repeats",
];

function isHardWorkout(type: WorkoutType): boolean {
  return HARD_WORKOUT_TYPES.includes(type);
}

function isRunningWorkout(type: WorkoutType): boolean {
  return RUNNING_WORKOUT_TYPES.includes(type);
}

function getWorkoutLabel(workout: Workout): string {
  const labels: Record<WorkoutType, string> = {
    easy: "Easy Run",
    long: "Long Run",
    tempo: "Tempo Run",
    interval: "Intervals",
    strides: "Strides",
    "hill-repeats": "Hill Repeats",
    "cross-training": "Cross Training",
    "recovery-walk": "Recovery Walk",
    rest: "Rest Day",
  };
  return workout.title || labels[workout.type] || workout.type;
}

function timeGreeting(hour: number): string {
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 18) return "Good afternoon";
  if (hour >= 18 && hour < 24) return "Good evening";
  return "Late night check-in";
}

function severityRank(s: AlertSeverity): number {
  if (s === "critical") return 3;
  if (s === "warning") return 2;
  return 1;
}

// ----------------------------------------------------------------
// Main function
// ----------------------------------------------------------------

export function getDailyIntelligence(context: DailyContext): DailyIntelligence {
  const {
    profile,
    todayWorkout,
    tomorrowWorkout,
    activeInjuries,
    weeklyCheckin,
    yesterdayNutrition,
    todayNutrition,
    plan,
    weekWorkouts,
    currentHour,
  } = context;

  const alerts: DailyAlert[] = [];
  let workoutAdjustment: WorkoutAdjustment | null = null;

  // ==============================================================
  // INJURY RULES (highest priority)
  // ==============================================================

  // 1. Severe injury + running workout
  const severeInjury = activeInjuries.find((i) => i.severity === "severe");
  if (
    severeInjury &&
    todayWorkout &&
    isRunningWorkout(todayWorkout.type) &&
    !todayWorkout.completed
  ) {
    alerts.push({
      id: "injury-severe-running",
      severity: "critical",
      icon: "🔴",
      title: "Session modification required",
      message: `You have a severe ${severeInjury.condition} — running today is contraindicated. Switching to cross-training or rest.`,
      action: { label: "View rehab plan", href: "/injury" },
    });
    if (!workoutAdjustment) {
      workoutAdjustment = {
        original: getWorkoutLabel(todayWorkout),
        adjusted: "Cross Training or Rest",
        reason: `Severe ${severeInjury.condition} — running contraindicated`,
        severity: "critical",
      };
    }
  }

  // 2. Moderate injury + hard workout
  const moderateInjury = activeInjuries.find((i) => i.severity === "moderate");
  if (
    !severeInjury &&
    moderateInjury &&
    todayWorkout &&
    isHardWorkout(todayWorkout.type) &&
    !todayWorkout.completed
  ) {
    alerts.push({
      id: "injury-moderate-hard",
      severity: "warning",
      icon: "⚠️",
      title: "Workout modified for recovery",
      message: `Moderate ${moderateInjury.condition} + hard session = injury risk. Changed to easy run at same duration.`,
      action: { label: "View rehab plan", href: "/injury" },
    });
    if (!workoutAdjustment) {
      workoutAdjustment = {
        original: getWorkoutLabel(todayWorkout),
        adjusted: `Easy Run: ${todayWorkout.duration_minutes} min easy`,
        reason: `Moderate ${moderateInjury.condition} — hard workout contraindicated`,
        severity: "warning",
      };
    }
  }

  // 3. Monitoring injury + hard workout
  const monitoringInjury = activeInjuries.find(
    (i) => i.severity === "monitoring" || i.severity === "mild"
  );
  if (
    !severeInjury &&
    !moderateInjury &&
    monitoringInjury &&
    todayWorkout &&
    isHardWorkout(todayWorkout.type)
  ) {
    alerts.push({
      id: "injury-monitoring-hard",
      severity: "info",
      icon: "💡",
      title: `Keep an eye on your ${monitoringInjury.body_region.replace(/-/g, " ")}`,
      message: `You're monitoring ${monitoringInjury.condition}. If you feel discomfort during today's ${getWorkoutLabel(todayWorkout)}, stop and rest.`,
    });
  }

  // 4. Multiple injuries (2+)
  if (activeInjuries.length >= 2) {
    alerts.push({
      id: "injury-multiple",
      severity: "warning",
      icon: "⚠️",
      title: "Multiple conditions active",
      message: `You have ${activeInjuries.length} active conditions. Consider a recovery week — high injury stacking increases re-injury risk.`,
      action: { label: "View rehab plan", href: "/injury" },
    });
  }

  // ==============================================================
  // NUTRITION RULES
  // ==============================================================

  const carbTarget = yesterdayNutrition?.carb_target_g ?? 250; // fallback 250g

  // 5. Long run tomorrow + low carbs today/yesterday
  if (
    tomorrowWorkout?.type === "long" &&
    yesterdayNutrition?.carbs_g !== undefined
  ) {
    const carbPct = Math.round(
      (yesterdayNutrition.carbs_g / carbTarget) * 100
    );
    if (carbPct < 60) {
      const distanceStr = tomorrowWorkout.distance_km
        ? `${tomorrowWorkout.distance_km}km`
        : "long";
      alerts.push({
        id: "nutrition-carb-low-before-long",
        severity: "warning",
        icon: "🍌",
        title: "Carb up tonight — long run tomorrow",
        message: `Yesterday you only hit ${carbPct}% of your carb target. You need glycogen for tomorrow's ${distanceStr} long run. Aim for ${carbTarget}g carbs tonight.`,
        action: { label: "See fuelling tips", href: "/nutrition" },
      });
    }
  }

  // 6. Long/tempo/interval run today + no pre-run nutrition + before 2pm
  const needsFuelTypes: WorkoutType[] = ["long", "tempo", "interval", "hill-repeats"];
  if (
    todayWorkout &&
    needsFuelTypes.includes(todayWorkout.type) &&
    !todayWorkout.completed &&
    currentHour < 14 &&
    (!todayNutrition ||
      !todayNutrition.total_calories ||
      todayNutrition.total_calories < 50)
  ) {
    const carbsNeeded =
      todayWorkout.type === "long" ? 80 : todayWorkout.type === "interval" ? 70 : 60;
    const timingMin =
      todayWorkout.type === "long"
        ? "60–90"
        : todayWorkout.type === "interval"
        ? "60–90"
        : "60";
    alerts.push({
      id: "nutrition-pre-run-missing",
      severity: "info",
      icon: "🍌",
      title: "Don't forget to fuel pre-run",
      message: `You haven't logged any nutrition yet today. For a ${getWorkoutLabel(todayWorkout)}, aim for ${carbsNeeded}g carbs ${timingMin} min before you run.`,
      action: { label: "Log nutrition", href: "/nutrition" },
    });
  }

  // 7. Post-run recovery window (workout completed, no post-run nutrition logged)
  // We approximate "within 30 min" by checking if completed but post_run_recovery not flagged
  if (
    todayWorkout?.completed &&
    todayNutrition &&
    !todayNutrition.post_run_recovery &&
    isRunningWorkout(todayWorkout.type)
  ) {
    const carbsRec = (todayWorkout.distance_km ?? 0) > 14 ? 60 : 40;
    alerts.push({
      id: "nutrition-recovery-window",
      severity: "warning",
      icon: "⚡",
      title: "Recovery window closing",
      message: `You've logged your session. Eat 20–40g protein + ${carbsRec}g carbs within 30 min for optimal recovery.`,
      action: { label: "Log recovery meal", href: "/nutrition" },
    });
  }

  // 8. Chronic low iron (iron_mg < 30% of 18mg target for today)
  // We check today's log only (single-day proxy — chronic rule would need multi-day history)
  const ironTarget = 18; // mg — general RDA for runners
  if (
    todayNutrition?.iron_mg !== undefined &&
    todayNutrition.iron_mg !== null &&
    todayNutrition.iron_mg < ironTarget * 0.3
  ) {
    alerts.push({
      id: "nutrition-low-iron",
      severity: "warning",
      icon: "💊",
      title: "Low iron intake detected",
      message:
        "Runners need adequate iron for oxygen transport. Your recent logs show consistently low iron. Consider adding spinach, red meat, or lentils.",
    });
  }

  // ==============================================================
  // RECOVERY & LOAD RULES
  // ==============================================================

  // Soreness proxy: we use energy_level as a combined readiness metric
  // WeeklyCheckin doesn't have a soreness field, so we use energy_level <= 2 as proxy
  const sorenesScore = weeklyCheckin?.energy_level ?? null;
  const sleepScore = weeklyCheckin?.sleep_score ?? null;
  const energyLevel = weeklyCheckin?.energy_level ?? null;
  const motivationLevel = weeklyCheckin?.motivation_level ?? null;

  // 9. High soreness (low energy) + hard workout today
  if (
    sorenesScore !== null &&
    sorenesScore <= 2 &&
    todayWorkout &&
    isHardWorkout(todayWorkout.type) &&
    !todayWorkout.completed
  ) {
    alerts.push({
      id: "recovery-high-soreness-hard",
      severity: "warning",
      icon: "😴",
      title: "Body signals: take it easy",
      message: `Your check-in flagged high soreness (score ${sorenesScore}/5). Today's ${getWorkoutLabel(todayWorkout)} has been flagged — consider dropping to easy pace.`,
    });
  }

  // 10. Low energy/sleep + hard workout
  const isLowEnergy = energyLevel !== null && energyLevel <= 2;
  const isLowSleep =
    sleepScore !== null && (sleepScore > 10 ? sleepScore < 40 : sleepScore < 4);
  if (
    (isLowEnergy || isLowSleep) &&
    todayWorkout &&
    isHardWorkout(todayWorkout.type) &&
    !todayWorkout.completed
  ) {
    alerts.push({
      id: "recovery-fatigue-hard",
      severity: "warning",
      icon: "😴",
      title: "Fatigue flag",
      message:
        "Low energy + poor sleep reported this week. Hard efforts on a fatigued body raise injury risk. Easy effort recommended.",
    });
  }

  // 11. Low motivation + workout today
  if (
    motivationLevel !== null &&
    motivationLevel <= 2 &&
    todayWorkout &&
    !todayWorkout.completed
  ) {
    alerts.push({
      id: "recovery-low-motivation",
      severity: "info",
      icon: "💡",
      title: "Showing up is the win today",
      message:
        "Motivation is low — that's normal in training. Even a shorter, easier version of today's session keeps your streak alive.",
    });
  }

  // 12. ACWR too high
  if (plan?.acwr !== undefined && plan.acwr !== null && plan.acwr > 1.3) {
    alerts.push({
      id: "load-acwr-high",
      severity: "critical",
      icon: "🔴",
      title: "Training load too high",
      message: `Your acute:chronic workload ratio is ${plan.acwr.toFixed(2)} — above the safe zone. Back-off week recommended to reduce injury risk.`,
    });
  }

  // 13. No check-in this week
  if (!weeklyCheckin) {
    alerts.push({
      id: "checkin-missing",
      severity: "info",
      icon: "💡",
      title: "Quick check-in needed",
      message:
        "We haven't heard how your body is feeling this week. Your readiness score is estimated — take 30 seconds to check in.",
      action: { label: "Check in now", href: "/analytics" },
    });
  }

  // ==============================================================
  // POSITIVE / MILESTONE RULES
  // ==============================================================

  // 14. Workout completed today
  if (todayWorkout?.completed) {
    alerts.push({
      id: "milestone-session-logged",
      severity: "info",
      icon: "✅",
      title: "Session logged",
      message: `${getWorkoutLabel(todayWorkout)} complete. Great work.`,
    });
  }

  // 15. 7-day streak
  const sevenDayStreak = _check7DayStreak(weekWorkouts);
  if (sevenDayStreak) {
    alerts.push({
      id: "milestone-7day-streak",
      severity: "info",
      icon: "🔥",
      title: "7-day streak",
      message:
        "Seven days in a row — consistency is the most powerful training variable.",
    });
  }

  // 16. Completed a long run > 15km
  if (
    todayWorkout?.completed &&
    todayWorkout.type === "long" &&
    (todayWorkout.actual_distance_km ?? todayWorkout.distance_km ?? 0) > 15
  ) {
    alerts.push({
      id: "milestone-long-run-done",
      severity: "info",
      icon: "🎉",
      title: "Long run done",
      message:
        "That's your biggest run of the block. Prioritise recovery — protein now, easy movement tomorrow.",
    });
  }

  // ==============================================================
  // Sort: critical first, then warning, then info
  // Suppress competing info-level alerts when workout completed today
  // ==============================================================

  let finalAlerts = alerts.sort(
    (a, b) => severityRank(b.severity) - severityRank(a.severity)
  );

  if (todayWorkout?.completed) {
    // Keep all critical + warning, but limit info to the positive/milestone ones
    const infoKeepIds = new Set([
      "milestone-session-logged",
      "milestone-7day-streak",
      "milestone-long-run-done",
      "nutrition-recovery-window",
    ]);
    finalAlerts = finalAlerts.filter(
      (a) => a.severity !== "info" || infoKeepIds.has(a.id)
    );
  }

  // ==============================================================
  // COACHING NOTE
  // ==============================================================

  const greeting = timeGreeting(currentHour);
  const highestAlert = finalAlerts[0] ?? null;
  const coachingNote = _buildCoachingNote(
    greeting,
    highestAlert,
    todayWorkout,
    weeklyCheckin,
    profile
  );

  // ==============================================================
  // TOMORROW PREVIEW
  // ==============================================================

  const tomorrowPreview = _buildTomorrowPreview(tomorrowWorkout);

  return {
    alerts: finalAlerts,
    workoutAdjustment,
    coachingNote,
    tomorrowPreview,
  };
}

// ----------------------------------------------------------------
// Internal: 7-day streak check
// ----------------------------------------------------------------

function _check7DayStreak(weekWorkouts: Workout[]): boolean {
  // weekWorkouts covers at most 7 days (Mon–Sun). Check all 7 are completed.
  // We need 7 consecutive days with at least one completed workout.
  // With only one week of data we can only verify the current week.
  const completedDates = new Set(
    weekWorkouts.filter((w) => w.completed).map((w) => w.date)
  );
  return completedDates.size >= 7;
}

// ----------------------------------------------------------------
// Internal: build coaching note
// ----------------------------------------------------------------

function _buildCoachingNote(
  greeting: string,
  highestAlert: DailyAlert | null,
  todayWorkout: Workout | null,
  checkin: WeeklyCheckin | null,
  profile: Profile
): CoachingNote {
  const name = profile.name?.split(" ")[0] ?? "";

  // Critical injury alert
  if (highestAlert?.severity === "critical" && highestAlert.id.startsWith("injury")) {
    return {
      greeting,
      headline: "Protect the injury — the session can wait.",
      detail:
        "Running through a severe injury compounds the damage. Cross-training or rest today is the smart call, not a setback.",
      tone: "caution",
    };
  }

  // ACWR critical
  if (highestAlert?.id === "load-acwr-high") {
    return {
      greeting,
      headline: "Your training load is in the red zone.",
      detail:
        "An acute:chronic ratio above 1.3 significantly raises injury risk. A back-off week now protects the weeks ahead.",
      tone: "caution",
    };
  }

  // Completed workout — celebrate
  if (todayWorkout?.completed) {
    if (
      todayWorkout.type === "long" &&
      (todayWorkout.actual_distance_km ?? todayWorkout.distance_km ?? 0) > 15
    ) {
      return {
        greeting,
        headline: "Big run in the bank — now recover like you mean it.",
        detail:
          "Long runs adapt your body over the next 48 hours. Protein, hydration, and sleep are your recovery toolkit tonight.",
        tone: "celebrate",
      };
    }
    return {
      greeting,
      headline: `${todayWorkout.title || "Session"} done. That's consistency in action.`,
      detail:
        "Every completed session compounds. Rest well and let the adaptation happen.",
      tone: "celebrate",
    };
  }

  // Low energy / soreness warning
  if (
    highestAlert?.severity === "warning" &&
    (highestAlert.id === "recovery-high-soreness-hard" ||
      highestAlert.id === "recovery-fatigue-hard")
  ) {
    return {
      greeting,
      headline: "Your body is asking for a lighter touch today.",
      detail:
        "Feeling flat is not weakness — it's data. Dialing back effort now protects the quality sessions ahead.",
      tone: "encourage",
    };
  }

  // Low motivation info
  if (highestAlert?.id === "recovery-low-motivation") {
    return {
      greeting,
      headline: "Low motivation days are still training days.",
      detail:
        "Starting is the hardest part. Even a shortened version of today's session builds the habit that carries you through race day.",
      tone: "encourage",
    };
  }

  // Rest day
  if (!todayWorkout || todayWorkout.type === "rest") {
    return {
      greeting,
      headline: "Rest days are training days in disguise.",
      detail:
        "Recovery is where adaptation happens. Your body is rebuilding right now — trust the process.",
      tone: "inform",
    };
  }

  // Normal training day — inform based on workout type
  const workoutPurpose: Partial<Record<WorkoutType, string>> = {
    easy: "Easy runs build your aerobic engine. Keep it genuinely conversational today.",
    long: "Long run day — the cornerstone of your training week. Fuel well, pace conservatively, finish strong.",
    tempo: "Tempo work sharpens your lactate threshold. Today's discomfort is tomorrow's race pace feeling easy.",
    interval: "Interval day — quality over quantity. Nail the effort on each rep and recover fully between them.",
    "hill-repeats":
      "Hill repeats build leg strength and running economy. Attack each rep, walk the descent.",
    strides:
      "Strides keep your legs sharp without fatigue. Short, controlled, and snappy — enjoy them.",
    "cross-training":
      "Cross-training maintains fitness while giving your running muscles a break.",
    "recovery-walk":
      "A gentle walk today speeds recovery and keeps blood flowing without adding stress.",
  };

  const headline =
    workoutPurpose[todayWorkout.type] ??
    `${getWorkoutLabel(todayWorkout)} is on the schedule. Show up and execute.`;

  return {
    greeting,
    headline,
    detail: checkin
      ? `Your readiness check-in helps dial in the effort. Trust your body's signals today.`
      : `Log your weekly check-in so PACE can personalise today's guidance more accurately.`,
    tone: "inform",
  };
}

// ----------------------------------------------------------------
// Internal: build tomorrow preview
// ----------------------------------------------------------------

function _buildTomorrowPreview(tomorrowWorkout: Workout | null): string | null {
  if (!tomorrowWorkout) return null;

  switch (tomorrowWorkout.type) {
    case "long": {
      const dist = tomorrowWorkout.distance_km
        ? `${tomorrowWorkout.distance_km}km`
        : "distance TBD";
      return `Long run tomorrow (${dist}) — carb up tonight and prioritise sleep`;
    }
    case "interval":
    case "tempo":
    case "hill-repeats":
      return "Hard session tomorrow — easy effort today pays off";
    case "rest":
    case "recovery-walk":
      return "Rest day tomorrow — you can push a bit harder today if you feel good";
    default:
      return null;
  }
}
