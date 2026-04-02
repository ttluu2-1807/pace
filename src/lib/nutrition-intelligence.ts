// ============================================================
// PACE — Nutrition Intelligence
// Pure data/logic file — no Supabase, no React.
// ============================================================

import type { WorkoutType, TrainingPlan, Workout } from "@/lib/types";
import type { WeeklyCheckin } from "@/lib/db";

// ----------------------------------------------------------------
// Core types
// ----------------------------------------------------------------

export interface FuelOption {
  meal: string;
  carbsG: number;
  prepTime: string; // e.g. "2 min" or "none"
  note: string;
}

export interface FuelPrimary {
  timing: string; // e.g. "45–60 min before"
  meal: string; // e.g. "Porridge with banana and honey"
  carbsG: number;
  why: string;
  alternatives: FuelOption[];
  noTimeOptions: FuelOption[];
}

export interface RecoveryWindow {
  windowMinutes: number;
  meal: string;
  proteinG: number;
  carbsG: number;
  why: string;
  alternatives: FuelOption[];
  noTimeOptions: FuelOption[];
}

export interface FuellingPlan {
  preRun: FuelPrimary | null; // null for rest days / recovery-walk
  duringRun: string | null;
  postRun: RecoveryWindow;
}

export interface ReadinessResult {
  score: number; // 0–100
  label: string;
  colour: "green" | "amber" | "red";
  insight: string;
  factors: string[];
}

// ----------------------------------------------------------------
// Internal helpers
// ----------------------------------------------------------------

function carbsForWeight(weightKg: number, gPerKg: number): number {
  return Math.round(weightKg * gPerKg);
}

// Standard recovery window used across multiple workout types
function standardRecovery(distanceKm?: number): RecoveryWindow {
  const isLong = (distanceKm ?? 0) > 14;
  return {
    windowMinutes: 30,
    meal: isLong
      ? "Rice, chicken or salmon, and roasted veggies"
      : "Greek yoghurt with banana and a drizzle of honey",
    proteinG: isLong ? 30 : 20,
    carbsG: isLong ? 60 : 40,
    why: "Your muscles are most receptive to nutrients in the 30-minute window after exercise. Protein repairs fibres; carbs restock glycogen.",
    alternatives: [
      {
        meal: "Chocolate milk (300 ml)",
        carbsG: 36,
        prepTime: "none",
        note: "Classic recovery drink — easy on the stomach",
      },
      {
        meal: "Milo with full-cream milk",
        carbsG: 42,
        prepTime: "2 min",
        note: "Good if you prefer a warm drink post-run",
      },
      {
        meal: "Smoothie: banana, yoghurt, oats, milk",
        carbsG: 55,
        prepTime: "5 min",
        note: "Blends protein and carbs in one go",
      },
    ],
    noTimeOptions: [
      {
        meal: "Banana + handful of almonds",
        carbsG: 27,
        prepTime: "none",
        note: "Grab and go",
      },
      {
        meal: "Squeeze pouch yoghurt + muesli bar",
        carbsG: 35,
        prepTime: "none",
        note: "No refrigeration needed",
      },
    ],
  };
}

function priorityRecovery(distanceKm?: number): RecoveryWindow {
  const base = standardRecovery(distanceKm);
  return {
    ...base,
    windowMinutes: 30,
    meal: "Chicken rice bowl or wholegrain toast with eggs and avocado",
    proteinG: 30,
    carbsG: 60,
    why: "Hard efforts deplete glycogen fast. Hitting protein + carbs within 30 min is critical — skip this window and you'll feel it tomorrow.",
    alternatives: [
      {
        meal: "Chocolate milk (400 ml) + banana",
        carbsG: 50,
        prepTime: "none",
        note: "Proven recovery combo used by elite athletes",
      },
      {
        meal: "Tuna on wholegrain toast",
        carbsG: 30,
        prepTime: "3 min",
        note: "High protein, decent carbs",
      },
      {
        meal: "Smoothie: oats, milk, banana, protein powder",
        carbsG: 65,
        prepTime: "5 min",
        note: "Complete recovery in a glass",
      },
    ],
    noTimeOptions: [
      {
        meal: "Chocolate milk (300 ml)",
        carbsG: 36,
        prepTime: "none",
        note: "Best single-item recovery option",
      },
      {
        meal: "Muesli bar + milk carton",
        carbsG: 40,
        prepTime: "none",
        note: "Shelf-stable and portable",
      },
    ],
  };
}

// ----------------------------------------------------------------
// getFuellingPlan
// ----------------------------------------------------------------

export function getFuellingPlan(
  workoutType: WorkoutType,
  distanceKm: number | undefined,
  userWeightKg: number
): FuellingPlan {
  const dist = distanceKm ?? 0;

  switch (workoutType) {
    case "rest": {
      return {
        preRun: null,
        duringRun: null,
        postRun: {
          windowMinutes: 0,
          meal: "Eat balanced meals throughout the day — focus on protein and vegetables",
          proteinG: 25,
          carbsG: 50,
          why: "On rest days, prioritise protein for muscle repair and steady carbs to maintain energy levels.",
          alternatives: [
            {
              meal: "Chicken salad with brown rice",
              carbsG: 45,
              prepTime: "10 min",
              note: "Light but sustaining",
            },
            {
              meal: "Eggs on sourdough toast",
              carbsG: 30,
              prepTime: "8 min",
              note: "Simple and high protein",
            },
            {
              meal: "Lentil soup with crusty bread",
              carbsG: 50,
              prepTime: "15 min",
              note: "Plant-based protein and fibre",
            },
          ],
          noTimeOptions: [
            {
              meal: "Cottage cheese with crackers",
              carbsG: 20,
              prepTime: "none",
              note: "High protein, no cooking",
            },
            {
              meal: "Greek yoghurt with berries",
              carbsG: 22,
              prepTime: "none",
              note: "Antioxidants and probiotics",
            },
          ],
        },
      };
    }

    case "recovery-walk": {
      return {
        preRun: null,
        duringRun: "Bring a water bottle — stay hydrated, especially in warm weather.",
        postRun: {
          windowMinutes: 60,
          meal: "Light snack — piece of fruit or yoghurt",
          proteinG: 10,
          carbsG: 25,
          why: "Recovery walks are low intensity — focus on hydration rather than a full recovery meal.",
          alternatives: [
            {
              meal: "Apple with peanut butter",
              carbsG: 25,
              prepTime: "1 min",
              note: "Satisfying and light",
            },
            {
              meal: "Handful of dates",
              carbsG: 30,
              prepTime: "none",
              note: "Quick natural sugars",
            },
            {
              meal: "Small Milo",
              carbsG: 28,
              prepTime: "2 min",
              note: "Hydrating and mildly energising",
            },
          ],
          noTimeOptions: [
            {
              meal: "Banana",
              carbsG: 27,
              prepTime: "none",
              note: "Always a good call",
            },
            {
              meal: "Rice cake with vegemite",
              carbsG: 15,
              prepTime: "none",
              note: "Salty, light, easy",
            },
          ],
        },
      };
    }

    case "easy": {
      // < 45 min: light snack 30 min before
      if (dist < 7 || dist === 0) {
        const carbsTarget = carbsForWeight(userWeightKg, 0.5);
        return {
          preRun: {
            timing: "30 min before",
            meal: "Banana or 2 rice cakes with honey",
            carbsG: carbsTarget,
            why: `A short easy run doesn't demand much fuel — a light snack prevents you going out on empty without weighing you down.`,
            alternatives: [
              {
                meal: "Slice of white toast with jam",
                carbsG: 28,
                prepTime: "3 min",
                note: "Easy to digest, low fibre",
              },
              {
                meal: "Small bowl of cereal with milk",
                carbsG: 30,
                prepTime: "2 min",
                note: "If you prefer something more substantial",
              },
              {
                meal: "2 Medjool dates",
                carbsG: 36,
                prepTime: "none",
                note: "Quick natural energy",
              },
            ],
            noTimeOptions: [
              {
                meal: "Banana",
                carbsG: 27,
                prepTime: "none",
                note: "The runner's classic",
              },
              {
                meal: "Sports gel",
                carbsG: 25,
                prepTime: "none",
                note: "If you have one on hand",
              },
            ],
          },
          duringRun: null,
          postRun: standardRecovery(dist),
        };
      }

      // 45–75 min: moderate carbs 45 min before
      const carbsTarget = carbsForWeight(userWeightKg, 0.8);
      return {
        preRun: {
          timing: "45 min before",
          meal: "Porridge with banana and a drizzle of honey",
          carbsG: carbsTarget,
          why: `An easy run in this range burns through moderate glycogen. A proper breakfast now means you'll feel smooth, not flat, by kilometre 5.`,
          alternatives: [
            {
              meal: "2 slices of toast with vegemite and banana",
              carbsG: 55,
              prepTime: "5 min",
              note: "Salty electrolytes from vegemite",
            },
            {
              meal: "Muesli with yoghurt and berries",
              carbsG: 60,
              prepTime: "3 min",
              note: "Higher fibre — eat at least 60 min before if sensitive",
            },
            {
              meal: "Overnight oats with banana",
              carbsG: 70,
              prepTime: "none (made night before)",
              note: "Prep the night before for a stress-free morning",
            },
          ],
          noTimeOptions: [
            {
              meal: "2 bananas",
              carbsG: 54,
              prepTime: "none",
              note: "Fast, familiar, effective",
            },
            {
              meal: "Rice cakes with honey (3)",
              carbsG: 45,
              prepTime: "1 min",
              note: "Low fibre, very easy to digest",
            },
          ],
        },
        duringRun: null,
        postRun: standardRecovery(dist),
      };
    }

    case "long": {
      const carbsTarget = carbsForWeight(userWeightKg, 1.2);
      const needsGels = dist > 15 || (distanceKm === undefined);
      return {
        preRun: {
          timing: "60–90 min before",
          meal: "Porridge with banana, honey, and a small handful of raisins",
          carbsG: carbsTarget,
          why: `Long runs deplete glycogen stores significantly. A full carb-loaded meal 60–90 min before means your tank is topped up at the start line, not already running low.`,
          alternatives: [
            {
              meal: "White rice with scrambled eggs and a banana",
              carbsG: 90,
              prepTime: "10 min",
              note: "Lower fibre — good for sensitive stomachs",
            },
            {
              meal: "Crumpets with honey + glass of juice",
              carbsG: 80,
              prepTime: "5 min",
              note: "Light but carb-dense",
            },
            {
              meal: "Bagel with peanut butter and banana",
              carbsG: 75,
              prepTime: "3 min",
              note: "Easy to prep, portable if needed",
            },
          ],
          noTimeOptions: [
            {
              meal: "2 bananas + sports drink",
              carbsG: 65,
              prepTime: "none",
              note: "Not ideal timing, but better than nothing",
            },
            {
              meal: "3 dates + rice cakes",
              carbsG: 55,
              prepTime: "none",
              note: "Eat early and walk to the start",
            },
          ],
        },
        duringRun: needsGels
          ? `Take a gel or 2–3 dates every 45 min after the first hour. Sip water or electrolytes regularly — don't wait until you're thirsty.`
          : `Sip water every 20 min. If you feel flat past 60 min, take a gel or a few dates.`,
        postRun: {
          ...priorityRecovery(dist),
          why: "The long run is your biggest glycogen hit of the week. Eating within 30 min is non-negotiable — your body is primed to absorb carbs and protein right now.",
        },
      };
    }

    case "tempo": {
      const carbsTarget = carbsForWeight(userWeightKg, 1.0);
      return {
        preRun: {
          timing: "60 min before",
          meal: "2 slices of sourdough toast with peanut butter and banana",
          carbsG: carbsTarget,
          why: `Tempo runs push your lactate threshold — a genuinely hard effort. You need enough carbs on board to sustain that intensity, but not so much that your gut gets in the way.`,
          alternatives: [
            {
              meal: "Porridge with honey and a banana",
              carbsG: 75,
              prepTime: "10 min",
              note: "Classic and reliable",
            },
            {
              meal: "Crumpets with honey + small glass of juice",
              carbsG: 65,
              prepTime: "5 min",
              note: "Lower fibre — good if your stomach is fussy before hard efforts",
            },
            {
              meal: "White rice with a fried egg and soy sauce",
              carbsG: 60,
              prepTime: "8 min",
              note: "Savoury option for those who dislike sweet food pre-run",
            },
          ],
          noTimeOptions: [
            {
              meal: "Banana + sports drink",
              carbsG: 55,
              prepTime: "none",
              note: "Liquid carbs absorb faster",
            },
            {
              meal: "2 rice cakes with honey",
              carbsG: 40,
              prepTime: "1 min",
              note: "Minimal gut load",
            },
          ],
        },
        duringRun: null,
        postRun: priorityRecovery(dist),
      };
    }

    case "interval": {
      const carbsTarget = carbsForWeight(userWeightKg, 1.1);
      return {
        preRun: {
          timing: "60–90 min before",
          meal: "Porridge with banana and honey",
          carbsG: carbsTarget,
          why: `Interval sessions are glycolytic — you're burning carbs fast. Going in fuelled means your reps stay sharp; going in empty means your form falls apart in the last few sets.`,
          alternatives: [
            {
              meal: "Toast with peanut butter and banana (2 slices)",
              carbsG: 70,
              prepTime: "5 min",
              note: "Easy to prep, good carb density",
            },
            {
              meal: "Muesli with yoghurt and honey",
              carbsG: 75,
              prepTime: "3 min",
              note: "Eat 90 min before if your stomach is sensitive",
            },
            {
              meal: "Crumpets with vegemite + banana",
              carbsG: 65,
              prepTime: "5 min",
              note: "Electrolytes from vegemite are a bonus",
            },
          ],
          noTimeOptions: [
            {
              meal: "Sports gel + banana",
              carbsG: 52,
              prepTime: "none",
              note: "Fast-acting if you're short on time",
            },
            {
              meal: "Dates (4–5) + small juice",
              carbsG: 60,
              prepTime: "none",
              note: "Natural sugars, easy on the gut",
            },
          ],
        },
        duringRun:
          dist > 10
            ? "Consider a gel at the halfway mark if the session runs long."
            : null,
        postRun: priorityRecovery(dist),
      };
    }

    case "hill-repeats": {
      const carbsTarget = carbsForWeight(userWeightKg, 1.1);
      return {
        preRun: {
          timing: "60–90 min before",
          meal: "Porridge with banana and honey",
          carbsG: carbsTarget,
          why: `Hill repeats are one of the most demanding sessions in training. Full glycogen means powerful reps; half-empty means your legs will give out before your engine does.`,
          alternatives: [
            {
              meal: "Toast with peanut butter and a banana (2 slices)",
              carbsG: 70,
              prepTime: "5 min",
              note: "Simple and effective",
            },
            {
              meal: "Weetbix (3) with full-cream milk and banana",
              carbsG: 68,
              prepTime: "2 min",
              note: "Australian classic — easy to digest",
            },
            {
              meal: "White rice with honey and a sprinkle of salt",
              carbsG: 72,
              prepTime: "5 min",
              note: "Low fibre, easy on the stomach",
            },
          ],
          noTimeOptions: [
            {
              meal: "2 bananas + electrolyte drink",
              carbsG: 54,
              prepTime: "none",
              note: "Covers both carbs and electrolytes",
            },
            {
              meal: "Energy bar + small juice",
              carbsG: 55,
              prepTime: "none",
              note: "Check label for low-fat options",
            },
          ],
        },
        duringRun: null,
        postRun: priorityRecovery(dist),
      };
    }

    case "strides": {
      const carbsTarget = carbsForWeight(userWeightKg, 0.5);
      return {
        preRun: {
          timing: "30 min before",
          meal: "Banana or a small handful of dates",
          carbsG: carbsTarget,
          why: `Strides are short and sharp — you don't need a full meal. A light snack tops you up without weighing you down.`,
          alternatives: [
            {
              meal: "Rice cake with honey",
              carbsG: 25,
              prepTime: "1 min",
              note: "Low fibre, digestive-friendly",
            },
            {
              meal: "Slice of white toast with jam",
              carbsG: 28,
              prepTime: "3 min",
              note: "If you want something more filling",
            },
            {
              meal: "Small glass of fruit juice",
              carbsG: 28,
              prepTime: "none",
              note: "Fast-absorbing liquid carbs",
            },
          ],
          noTimeOptions: [
            {
              meal: "Banana",
              carbsG: 27,
              prepTime: "none",
              note: "Always the easy answer",
            },
            {
              meal: "2 Medjool dates",
              carbsG: 36,
              prepTime: "none",
              note: "Quick and portable",
            },
          ],
        },
        duringRun: null,
        postRun: standardRecovery(dist),
      };
    }

    case "cross-training": {
      const carbsTarget = carbsForWeight(userWeightKg, 0.7);
      return {
        preRun: {
          timing: "45 min before",
          meal: "Banana and a slice of wholegrain toast with peanut butter",
          carbsG: carbsTarget,
          why: `Cross-training uses different muscle groups but still needs fuel. A moderate carb snack keeps energy levels steady without overloading your gut.`,
          alternatives: [
            {
              meal: "Small bowl of muesli with yoghurt",
              carbsG: 55,
              prepTime: "2 min",
              note: "Slower release energy",
            },
            {
              meal: "Smoothie: banana, oats, milk",
              carbsG: 60,
              prepTime: "5 min",
              note: "Liquid option if you prefer",
            },
            {
              meal: "2 Weetbix with milk and honey",
              carbsG: 50,
              prepTime: "2 min",
              note: "Quick and familiar",
            },
          ],
          noTimeOptions: [
            {
              meal: "Banana",
              carbsG: 27,
              prepTime: "none",
              note: "Reliable low-effort option",
            },
            {
              meal: "Rice cake with honey",
              carbsG: 25,
              prepTime: "1 min",
              note: "Light and easy to digest",
            },
          ],
        },
        duringRun: null,
        postRun: standardRecovery(dist),
      };
    }

    default: {
      // Fallback — shouldn't be reached with typed WorkoutType
      return {
        preRun: null,
        duringRun: null,
        postRun: standardRecovery(dist),
      };
    }
  }
}

// ----------------------------------------------------------------
// getReadinessScore
// ----------------------------------------------------------------

export function getReadinessScore(checkin: WeeklyCheckin | null): ReadinessResult {
  if (!checkin) {
    return {
      score: 60,
      label: "Feeling unknown",
      colour: "amber",
      insight: "Log your weekly check-in so PACE can tailor today's brief to how you're actually feeling.",
      factors: [
        "No check-in this week — readiness estimated at baseline",
        "Tap 'Check in' to give PACE a clearer picture",
      ],
    };
  }

  // Map available fields onto the 5-factor model
  // WeeklyCheckin has: energy_level, motivation_level, sleep_score, hrv_score
  // We treat soreness and mood as missing (default to neutral 3)
  const energy = normalise(checkin.energy_level, 5); // 0–1
  const motivation = normalise(checkin.motivation_level, 5);
  const sleep = normaliseSleep(checkin.sleep_score); // sleep_score may be 0–100 scale
  // soreness not in schema — default to neutral (0.6 = slightly positive)
  const soreness = 0.6;
  // mood not in schema — default to neutral
  const mood = 0.6;

  // Weighted score (sleep 25%, energy 25%, soreness 20%, mood 15%, motivation 15%)
  const weighted =
    sleep * 0.25 +
    energy * 0.25 +
    soreness * 0.2 +
    mood * 0.15 +
    motivation * 0.15;

  const score = Math.round(weighted * 100);

  const factors: string[] = [];
  const sleepPct = Math.round(sleep * 100);
  const energyPct = Math.round(energy * 100);
  const motivationPct = Math.round(motivation * 100);

  if (checkin.sleep_score !== undefined) {
    factors.push(
      sleepPct >= 70
        ? `Sleep looks good this week (${checkin.sleep_score}/10)`
        : sleepPct >= 45
          ? `Sleep is moderate this week — prioritise an early night`
          : `Sleep is low this week — this is the biggest drag on readiness`
    );
  }
  if (checkin.energy_level !== undefined) {
    factors.push(
      energyPct >= 70
        ? `Energy levels are solid — you're ready to push`
        : energyPct >= 45
          ? `Energy is average — keep today's effort in check`
          : `Energy is low — consider swapping today's session for an easy run`
    );
  }
  if (checkin.motivation_level !== undefined && factors.length < 3) {
    factors.push(
      motivationPct >= 70
        ? `Motivation is high — use it`
        : `Motivation is lower than usual — start anyway; it usually picks up`
    );
  }

  if (factors.length === 0) {
    factors.push("Based on your check-in data");
  }

  let label: string;
  let colour: "green" | "amber" | "red";
  let insight: string;

  if (score >= 75) {
    label = "Ready to train";
    colour = "green";
    insight = "Your energy and sleep are solid — a good day to push in training.";
  } else if (score >= 55) {
    label = "Take it easy";
    colour = "amber";
    insight = "You're OK to train but hold back a little — don't turn an easy day into a hard one.";
  } else if (score >= 35) {
    label = "Consider rest";
    colour = "amber";
    insight = "Your body is sending signals. An easy session or swap to cross-training is a smart call today.";
  } else {
    label = "Rest day recommended";
    colour = "red";
    insight = "Your readiness is low. Rest today — training through fatigue leads to injury, not fitness.";
  }

  return { score, label, colour, insight, factors };
}

/** Normalise a 1–max value to 0–1. Returns 0.5 if undefined. */
function normalise(value: number | undefined, max: number): number {
  if (value === undefined || value === null) return 0.5;
  return Math.max(0, Math.min(1, (value - 1) / (max - 1)));
}

/** Normalise sleep_score — could be 1–10 scale or 0–100. */
function normaliseSleep(value: number | undefined): number {
  if (value === undefined || value === null) return 0.5;
  // If > 10, assume 0–100 scale
  if (value > 10) return Math.max(0, Math.min(1, value / 100));
  return Math.max(0, Math.min(1, (value - 1) / 9));
}

// ----------------------------------------------------------------
// getWorkoutWhy
// ----------------------------------------------------------------

export function getWorkoutWhy(
  workout: Workout,
  plan: TrainingPlan | null
): string {
  const phase = plan?.current_phase ?? null;
  const type = workout.type;

  if (type === "rest") {
    return "Recovery is where adaptation happens. Your body repairs and grows stronger on rest days — today counts just as much as the hard sessions.";
  }

  if (type === "recovery-walk") {
    return "Active recovery keeps blood flowing to your muscles without adding stress. A gentle walk today speeds up how quickly you'll be ready for the next session.";
  }

  if (type === "long") {
    return "Long runs are the cornerstone of your week. They build fat oxidation, mental toughness, and the aerobic base that makes every other session feel easier. This is the most important run of your week.";
  }

  if (type === "tempo") {
    if (phase === "build" || phase === "peak") {
      return "Tempo runs push your lactate threshold — the speed you can hold for a long time. This is the work that turns aerobic fitness into race fitness. Uncomfortable is the point.";
    }
    return "Tempo runs push your lactate threshold — the speed you can hold for a long time. This is the work that makes race pace feel comfortable.";
  }

  if (type === "interval") {
    if (phase === "peak") {
      return "Intervals at peak phase sharpen your top-end speed and teach your legs to handle race pace under fatigue. Stay controlled on the recoveries — that's where the adaptation happens.";
    }
    if (phase === "build") {
      return "Interval sessions build your VO2 max and the neuromuscular power to run fast. Each rep is a deposit; the recovery between reps is when the interest accrues.";
    }
    return "Interval training spikes your aerobic ceiling. A few minutes of discomfort per rep compounds into meaningful fitness gains over the weeks.";
  }

  if (type === "hill-repeats") {
    return "Hills build leg strength, running economy, and mental resilience without the pounding of flat speedwork. Think of each rep as a strength session wearing running shoes.";
  }

  if (type === "strides") {
    return "Strides activate fast-twitch fibres and keep your legs feeling sharp without accumulating real fatigue. They're short enough to be almost free — do them well.";
  }

  if (type === "cross-training") {
    if (phase === "recovery") {
      return "Cross-training in a recovery phase keeps the cardiovascular engine ticking over without stressing your joints or your running muscles. Low risk, real benefit.";
    }
    return "Cross-training builds fitness with zero injury risk from running-specific load. Swim, cycle, or row — your heart doesn't know the difference.";
  }

  if (type === "easy") {
    if (phase === "base") {
      return "You're in the base phase — easy aerobic work builds your engine without stressing your system. Run easy enough to hold a conversation, and this run quietly improves everything else.";
    }
    if (phase === "build" || phase === "peak") {
      return "Easy runs in a hard training block are deceptively important. They promote recovery, keep your aerobic engine running, and make sure you're fresh for tomorrow's quality work.";
    }
    if (phase === "taper") {
      return "Tapering means keeping the legs moving without adding load. This run reminds your body what it feels like to run — nothing more.";
    }
    return "Easy running builds your aerobic base more effectively than people realise. Keep the effort genuinely easy — if in doubt, slow down.";
  }

  return "Every session in your plan has a purpose. Trust the process and show up.";
}
