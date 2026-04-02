// ============================================================
// PACE — Training Schedule Generator
// Generates a full set of workouts for a training plan.
// ============================================================

import type { TrainingPlan, Workout, WorkoutType } from "@/lib/types";

// Days of week indices we spread workouts across for each frequency.
// 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
const FREQUENCY_DAY_SLOTS: Record<number, number[]> = {
  1: [0],             // Sun
  2: [1, 4],          // Mon, Thu
  3: [1, 3, 6],       // Mon, Wed, Sat
  4: [1, 3, 5, 0],    // Mon, Wed, Fri, Sun
  5: [1, 2, 4, 5, 0], // Mon, Tue, Thu, Fri, Sun
  6: [1, 2, 3, 4, 5, 0], // Mon–Fri, Sun
  7: [0, 1, 2, 3, 4, 5, 6],
};

// Peak long run distances (km) by race type
const PEAK_LONG_RUN_KM: Record<string, number> = {
  "5k": 10,
  "10k": 16,
  "half-marathon": 20,
  marathon: 32,
  general: 12,
};

function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Return the Monday of the week that contains `date`
function getMondayOf(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

type WorkoutSpec = {
  type: WorkoutType;
  title: string;
  description: string;
  duration_minutes: number;
  distance_km?: number;
  target_rpe?: number;
  isLongRun?: boolean;
};

function buildBaseWeek(
  weekNumber: number,
  totalWeeks: number,
  frequency: number,
  peakLongKm: number,
  raceType: string
): WorkoutSpec[] {
  const basePhaseEnd = Math.floor(totalWeeks * 0.3);
  const buildPhaseEnd = Math.floor(totalWeeks * 0.6);
  const peakPhaseEnd = Math.floor(totalWeeks * 0.85);

  let phase: "base" | "build" | "peak" | "taper";
  if (weekNumber <= basePhaseEnd) {
    phase = "base";
  } else if (weekNumber <= buildPhaseEnd) {
    phase = "build";
  } else if (weekNumber <= peakPhaseEnd) {
    phase = "peak";
  } else {
    phase = "taper";
  }

  // Progress ratio within phase (0..1)
  const phaseProgress = (() => {
    if (phase === "base") return (weekNumber - 1) / Math.max(basePhaseEnd - 1, 1);
    if (phase === "build")
      return (weekNumber - basePhaseEnd - 1) / Math.max(buildPhaseEnd - basePhaseEnd - 1, 1);
    if (phase === "peak")
      return (weekNumber - buildPhaseEnd - 1) / Math.max(peakPhaseEnd - buildPhaseEnd - 1, 1);
    return (weekNumber - peakPhaseEnd - 1) / Math.max(totalWeeks - peakPhaseEnd - 1, 1);
  })();

  // Long run distance ramps up through base/build/peak, then reduces in taper
  const longRunKm = (() => {
    const startKm = Math.max(peakLongKm * 0.4, 4);
    if (phase === "base") {
      return Math.round((startKm + (peakLongKm * 0.6 - startKm) * phaseProgress) * 2) / 2;
    }
    if (phase === "build") {
      return Math.round((peakLongKm * 0.6 + (peakLongKm * 0.85 - peakLongKm * 0.6) * phaseProgress) * 2) / 2;
    }
    if (phase === "peak") {
      return Math.round((peakLongKm * 0.85 + (peakLongKm - peakLongKm * 0.85) * phaseProgress) * 2) / 2;
    }
    // Taper: reduce from 60% of peak down to 30%
    return Math.round((peakLongKm * 0.6 - peakLongKm * 0.3 * phaseProgress) * 2) / 2;
  })();

  const longRunMinutes = Math.round(longRunKm * 6.5); // ~6:30/km easy pace

  // Easy run distance: roughly half the long run, scaled slightly
  const easyKm = Math.max(Math.round((longRunKm * 0.55) * 2) / 2, 3);
  const easyMinutes = Math.round(easyKm * 6.5);

  // Define workout pool by phase
  const workouts: WorkoutSpec[] = [];

  // Long run always goes in (unless very low frequency plans get fewer slots)
  const longRun: WorkoutSpec = {
    type: "long",
    title: "Long Run",
    description:
      phase === "taper"
        ? `Easy long run at comfortable effort. Focus on feeling relaxed. ${longRunKm} km target.`
        : `Build your aerobic base. Run at a conversational pace for ${longRunKm} km.`,
    duration_minutes: longRunMinutes,
    distance_km: longRunKm,
    target_rpe: phase === "taper" ? 5 : 6,
    isLongRun: true,
  };

  workouts.push(longRun);

  const remainingSlots = Math.max(frequency - 1, 0);

  if (phase === "base") {
    // Easy runs + optional strides
    for (let i = 0; i < remainingSlots; i++) {
      if (i === 0 && remainingSlots >= 2) {
        workouts.push({
          type: "strides",
          title: "Easy Run + Strides",
          description: `${easyKm} km easy with 4×20s strides at the end. Strides should feel fast but controlled.`,
          duration_minutes: easyMinutes + 10,
          distance_km: easyKm,
          target_rpe: 6,
        });
      } else {
        workouts.push({
          type: "easy",
          title: "Easy Run",
          description: `${easyKm} km at a comfortable, conversational pace. Keep effort low — this builds your aerobic base.`,
          duration_minutes: easyMinutes,
          distance_km: easyKm,
          target_rpe: 5,
        });
      }
    }
  } else if (phase === "build") {
    // Add tempo runs
    const tempoKm = Math.max(Math.round(longRunKm * 0.3 * 2) / 2, 3);
    const tempoMinutes = Math.round(tempoKm * 5.0); // ~5:00/km tempo

    for (let i = 0; i < remainingSlots; i++) {
      if (i === 0) {
        workouts.push({
          type: "tempo",
          title: "Tempo Run",
          description: `Warm up 10 min, then ${tempoKm} km at comfortably hard pace (can speak in short phrases), cool down 10 min.`,
          duration_minutes: tempoMinutes + 20,
          distance_km: tempoKm + 3,
          target_rpe: 7,
        });
      } else {
        workouts.push({
          type: "easy",
          title: "Easy Run",
          description: `${easyKm} km easy recovery run. Keep it truly easy — conversational pace.`,
          duration_minutes: easyMinutes,
          distance_km: easyKm,
          target_rpe: 5,
        });
      }
    }
  } else if (phase === "peak") {
    // Intervals + hill repeats
    const intervalKm = Math.max(Math.round(longRunKm * 0.25 * 2) / 2, 2);

    for (let i = 0; i < remainingSlots; i++) {
      if (i === 0) {
        workouts.push({
          type: "interval",
          title: "Interval Session",
          description: `Warm up 15 min, then 6×400m at hard effort (RPE 8–9) with 90s recovery jog between each. Cool down 10 min.`,
          duration_minutes: 55,
          distance_km: intervalKm + 4,
          target_rpe: 8,
        });
      } else if (i === 1 && remainingSlots >= 3) {
        workouts.push({
          type: "hill-repeats",
          title: "Hill Repeats",
          description: `Warm up 10 min, then 8×30s uphill efforts at hard effort. Walk/jog back down for recovery. Cool down 10 min.`,
          duration_minutes: 45,
          distance_km: intervalKm + 2,
          target_rpe: 8,
        });
      } else {
        workouts.push({
          type: "easy",
          title: "Easy Run",
          description: `${easyKm} km easy recovery run. Protect your legs for the quality sessions.`,
          duration_minutes: easyMinutes,
          distance_km: easyKm,
          target_rpe: 5,
        });
      }
    }
  } else {
    // Taper: easy runs + short race pace
    const racePaceKm = (() => {
      if (raceType === "5k") return 3;
      if (raceType === "10k") return 5;
      if (raceType === "half-marathon") return 6;
      if (raceType === "marathon") return 8;
      return 4;
    })();
    const racePaceMinPerKm = (() => {
      if (raceType === "5k") return 4.5;
      if (raceType === "10k") return 5.0;
      if (raceType === "half-marathon") return 5.5;
      if (raceType === "marathon") return 5.75;
      return 5.5;
    })();

    for (let i = 0; i < remainingSlots; i++) {
      if (i === 0 && remainingSlots >= 1) {
        workouts.push({
          type: "tempo",
          title: "Race Pace Tune-up",
          description: `Warm up 10 min, ${racePaceKm} km at goal race pace, cool down 10 min. Stay sharp without fatiguing.`,
          duration_minutes: Math.round(racePaceKm * racePaceMinPerKm) + 20,
          distance_km: racePaceKm + 3,
          target_rpe: 7,
        });
      } else {
        workouts.push({
          type: "easy",
          title: "Easy Recovery Run",
          description: `Short, easy run to keep the legs moving. ${Math.max(easyKm - 1, 3)} km at very easy effort.`,
          duration_minutes: Math.max(easyMinutes - 10, 20),
          distance_km: Math.max(easyKm - 1, 3),
          target_rpe: 4,
        });
      }
    }
  }

  return workouts;
}

export type WorkoutInsert = Omit<Workout, "id" | "created_at"> & {
  plan_id?: string;
};

export function generateTrainingSchedule(
  plan: TrainingPlan,
  weeklyFrequency: number
): WorkoutInsert[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const raceType = plan.race_type ?? "general";
  const peakLongKm = PEAK_LONG_RUN_KM[raceType] ?? 12;

  // Clamp frequency to valid range
  const freq = Math.min(Math.max(weeklyFrequency, 1), 7);
  const daySlots = FREQUENCY_DAY_SLOTS[freq] ?? FREQUENCY_DAY_SLOTS[3];

  const allWorkouts: WorkoutInsert[] = [];

  // Start from the Monday of the current week
  const planStart = getMondayOf(today);

  for (let weekIdx = 0; weekIdx < plan.total_weeks; weekIdx++) {
    const weekNumber = weekIdx + 1;

    // Monday of this training week
    const weekMonday = new Date(planStart);
    weekMonday.setDate(weekMonday.getDate() + weekIdx * 7);

    // Generate workout specs for this week
    const specs = buildBaseWeek(weekNumber, plan.total_weeks, freq, peakLongKm, raceType);

    // Assign specs to day slots. Long run goes last (Sunday-ish slot).
    // Sort specs so long run is always placed at the last slot.
    const longRunSpec = specs.find((s) => s.isLongRun);
    const otherSpecs = specs.filter((s) => !s.isLongRun);

    // Reorder: other workouts fill earlier slots, long run takes last slot
    const orderedSpecs: WorkoutSpec[] = [...otherSpecs];
    if (longRunSpec) orderedSpecs.push(longRunSpec);

    // Sort daySlots ascending so we go Mon → Wed → ... → Sun
    const sortedSlots = [...daySlots].sort((a, b) => {
      // Convert 0 (Sun) to 7 for sorting purposes so Sunday is last
      const sa = a === 0 ? 7 : a;
      const sb = b === 0 ? 7 : b;
      return sa - sb;
    });

    sortedSlots.forEach((dayOfWeek, i) => {
      const spec = orderedSpecs[i];
      if (!spec) return;

      // Compute date for this day of week within the current week
      // weekMonday is a Monday (day index 1). Offset to target dayOfWeek.
      const dayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // offset from Monday
      const workoutDate = new Date(weekMonday);
      workoutDate.setDate(workoutDate.getDate() + dayOffset);

      // Skip workouts that are strictly before today
      if (workoutDate < today) return;

      allWorkouts.push({
        user_id: plan.user_id,
        plan_id: plan.id,
        date: toDateStr(workoutDate),
        type: spec.type,
        title: spec.title,
        description: spec.description,
        duration_minutes: spec.duration_minutes,
        distance_km: spec.distance_km,
        target_rpe: spec.target_rpe,
        completed: false,
      });
    });
  }

  return allWorkouts;
}
