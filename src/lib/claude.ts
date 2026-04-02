import Anthropic from "@anthropic-ai/sdk"

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface CoachContext {
  profile: {
    name: string | null
    age: number | null
    sex: string | null
    weight_kg: number | null
    height_cm: number | null
    weekly_run_frequency: number
    longest_recent_run_km: number
    primary_goal: string
    coaching_voice: string
  }
  activeInjuries: Array<{
    body_region: string
    condition: string
    severity: string
    status: string
  }>
  currentPlan: {
    name: string
    race_type: string | null
    race_date: string | null
    current_phase: string
    current_week: number
    total_weeks: number
    weekly_volume_km: number
  } | null
  recentWorkouts: Array<{
    date: string
    type: string
    title: string
    completed: boolean
    actual_distance_km: number | null
    actual_duration_minutes: number | null
    notes: string | null
  }>
  todayWorkout: {
    type: string
    title: string
    distance_km: number | null
    duration_minutes: number | null
    completed: boolean
  } | null
  thisWeekNutrition: {
    avg_carbs_g: number
    avg_protein_g: number
    avg_calories: number
    days_logged: number
  } | null
}

export function buildSystemPrompt(context: CoachContext, coachingVoice: string): string {
  const voiceInstructions = {
    encouraging: "You are warm, supportive, and celebratory. Acknowledge effort before giving advice. Use the athlete's name often.",
    clinical: "You are precise, evidence-based, and efficient. Give specific numbers, cite principles, avoid fluff.",
    direct: "You are blunt and no-nonsense. Get to the point immediately. No preamble.",
    balanced: "You balance encouragement with straight talk. Be honest but supportive.",
  }

  return `You are PACE Coach — a personal running coach AI built into the PACE app.

COACHING STYLE: ${voiceInstructions[coachingVoice as keyof typeof voiceInstructions] ?? voiceInstructions.balanced}

ATHLETE PROFILE:
${context.profile.name ? `Name: ${context.profile.name}` : ""}
${context.profile.age ? `Age: ${context.profile.age}` : ""}
${context.profile.sex ? `Sex: ${context.profile.sex}` : ""}
${context.profile.weight_kg ? `Weight: ${context.profile.weight_kg}kg` : ""}
Goal: ${context.profile.primary_goal}
Weekly run frequency: ${context.profile.weekly_run_frequency}x/week
Longest recent run: ${context.profile.longest_recent_run_km}km

CURRENT TRAINING PLAN:
${context.currentPlan ? `${context.currentPlan.name}
Race: ${context.currentPlan.race_type ?? "General"} ${context.currentPlan.race_date ? `on ${context.currentPlan.race_date}` : ""}
Phase: ${context.currentPlan.current_phase} | Week ${context.currentPlan.current_week} of ${context.currentPlan.total_weeks}
Weekly volume: ${context.currentPlan.weekly_volume_km}km` : "No active training plan"}

TODAY'S SESSION:
${context.todayWorkout ? `${context.todayWorkout.title} (${context.todayWorkout.type})
${context.todayWorkout.distance_km ? `${context.todayWorkout.distance_km}km` : ""}${context.todayWorkout.duration_minutes ? ` · ${context.todayWorkout.duration_minutes} min` : ""}
Status: ${context.todayWorkout.completed ? "Completed ✓" : "Not yet done"}` : "No session scheduled today"}

ACTIVE INJURIES:
${context.activeInjuries.length === 0 ? "None" : context.activeInjuries.map(i => `- ${i.condition} (${i.body_region}) — ${i.severity}, ${i.status}`).join("\n")}

RECENT WORKOUTS (last 7):
${context.recentWorkouts.slice(0, 7).map(w => `- ${w.date}: ${w.title} ${w.completed ? "✓" : "✗"}${w.actual_distance_km ? ` ${w.actual_distance_km}km` : ""}`).join("\n")}

NUTRITION THIS WEEK:
${context.thisWeekNutrition ? `Avg carbs: ${context.thisWeekNutrition.avg_carbs_g}g | Avg protein: ${context.thisWeekNutrition.avg_protein_g}g | Avg calories: ${context.thisWeekNutrition.avg_calories}kcal | Days logged: ${context.thisWeekNutrition.days_logged}/7` : "Not logged this week"}

IMPORTANT GUIDELINES:
- Always reference the athlete's actual data — never give generic advice
- You are not a doctor or registered dietitian. For medical concerns, always recommend seeing a professional.
- Be specific: give numbers, timings, progressions — not vague suggestions
- Keep responses concise (3-5 sentences max unless asked for detail)
- If you don't have enough data to answer confidently, say so and ask a clarifying question
- Today's date: ${new Date().toLocaleDateString("en-AU", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`
}
