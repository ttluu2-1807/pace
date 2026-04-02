// ============================================================
// PACE — Injury Intelligence Library
// Pure logic: no React, no Supabase imports.
// Provides condition-specific rehab protocols, return-to-run
// estimates, and training modification rules.
// ============================================================

import type { BodyRegion, InjurySeverity, Injury, OnsetType } from "@/lib/types";

// ----------------------------------------------------------------
// Core types
// ----------------------------------------------------------------

export interface RehabExercise {
  name: string;
  sets: string;
  frequency: string;
  cue: string;
  progressionNote: string;
}

export interface RehabPhase {
  phase: string;
  durationDays: string;
  goal: string;
  exercises: RehabExercise[];
  runningGuidance: string;
  redFlags: string[];
}

export interface TrainingModification {
  appliesTo: InjurySeverity[];
  rule: string;
  reason: string;
}

export interface InjuryProtocol {
  condition: string;
  bodyRegion: BodyRegion | string;
  overview: string;
  typicalRecoveryDays: { mild: number; moderate: number; severe: number };
  phases: RehabPhase[];
  trainingModifications: TrainingModification[];
  returnToRunCriteria: string[];
  preventionTips: string[];
  redFlagSymptoms: string[];
  nutritionFocus: string[];
}

export interface ReturnToRunEstimate {
  minDays: number;
  maxDays: number;
  label: string;
  confidence: string;
  milestones: string[];
}

export interface ActiveModification {
  rule: string;
  reason: string;
  severity: "warning" | "critical";
}

// ----------------------------------------------------------------
// Protocol definitions
// ----------------------------------------------------------------

const SHIN_SPLINTS_PROTOCOL: InjuryProtocol = {
  condition: "Shin Splints (MTSS)",
  bodyRegion: "lower-leg",
  overview:
    "Medial Tibial Stress Syndrome (MTSS) is an overuse injury caused by repetitive stress on the tibia and surrounding connective tissue. It typically develops when training load increases too quickly. With appropriate load management and progressive rehab, most runners return to full training within 4–8 weeks.",
  typicalRecoveryDays: { mild: 21, moderate: 42, severe: 84 },
  phases: [
    {
      phase: "Phase 1: Offload & Protect",
      durationDays: "3–7 days",
      goal: "Reduce inflammation and protect the tibial periosteum",
      exercises: [
        {
          name: "Calf Raises (seated, bilateral)",
          sets: "3 sets of 15",
          frequency: "Daily",
          cue: "Slow controlled movement; no pain allowed",
          progressionNote: "Progress to standing when pain-free seated",
        },
        {
          name: "Shin Tapping / Tibialis Anterior Activation",
          sets: "3 sets of 20",
          frequency: "Daily",
          cue: "Tap toes off the floor, feeling the front of the shin engage",
          progressionNote: "Increase reps once form is consistent",
        },
        {
          name: "Ice Application",
          sets: "10–15 min per session",
          frequency: "3x/day",
          cue: "Wrap ice in a cloth; never apply directly to skin",
          progressionNote: "Transition to contrast bathing after 72 hours",
        },
      ],
      runningGuidance: "No running. Walk only if completely pain-free.",
      redFlags: [
        "Sharp, localised point tenderness on the bone",
        "Night pain that wakes you from sleep",
        "Swelling over the shin that does not resolve with rest",
      ],
    },
    {
      phase: "Phase 2: Load & Strengthen",
      durationDays: "7–21 days",
      goal: "Restore calf and tibialis strength; introduce low-impact loading",
      exercises: [
        {
          name: "Single-Leg Calf Raises",
          sets: "3 sets of 12",
          frequency: "Daily",
          cue: "Full range of motion; slow 3-second descent",
          progressionNote: "Progress to 20 reps before moving to Phase 3",
        },
        {
          name: "Tibialis Anterior Strengthening (resistance band)",
          sets: "3 sets of 15",
          frequency: "Daily",
          cue: "Dorsiflexion against resistance; avoid compensating with the hip",
          progressionNote: "Increase band resistance every 5–7 days",
        },
        {
          name: "Walking Progression",
          sets: "20–30 min",
          frequency: "Daily",
          cue: "Maintain normal gait; stop if shin aching begins",
          progressionNote: "Build to 45 min pain-free before run-walk",
        },
      ],
      runningGuidance:
        "Walking is fine if pain-free. Begin run-walk intervals (1 min run / 2 min walk) only when 45-min walk is pain-free.",
      redFlags: [
        "Pain during or immediately after walking",
        "Bone tenderness that is worsening rather than improving",
      ],
    },
    {
      phase: "Phase 3: Return to Running",
      durationDays: "14–28 days",
      goal: "Gradually restore full running load with a 10% weekly volume rule",
      exercises: [
        {
          name: "Run-Walk Intervals",
          sets: "3 min run / 1 min walk × 6",
          frequency: "Every other day",
          cue: "Easy effort (Zone 2 only); stop at first sign of shin discomfort",
          progressionNote: "Increase running segment by 2 min each session if pain-free",
        },
        {
          name: "Single-Leg Calf Raise Endurance",
          sets: "3 sets of 20–25",
          frequency: "3x/week",
          cue: "Add light weight once bodyweight is easy",
          progressionNote: "Maintain throughout training to prevent recurrence",
        },
      ],
      runningGuidance:
        "Run-walk intervals on flat surfaces. Increase total volume by no more than 10% per week. No speedwork or hill sessions until 2 symptom-free weeks at full volume.",
      redFlags: [
        "Shin pain during runs that does not warm up and resolve",
        "Pain rating above 2/10 after any run session",
      ],
    },
  ],
  trainingModifications: [
    {
      appliesTo: ["severe"],
      rule: "No running — cross-train with cycling or pool running",
      reason: "Impact forces must be eliminated to allow tibial stress reaction to heal",
    },
    {
      appliesTo: ["moderate"],
      rule: "Reduce weekly running volume by 50%; eliminate all speedwork and hill sessions",
      reason: "Reduces load on tibial periosteum while maintaining base fitness",
    },
    {
      appliesTo: ["mild", "monitoring"],
      rule: "Reduce weekly running volume by 20%; easy-effort runs only (Zone 1–2)",
      reason: "Light load management prevents progression to a stress injury",
    },
  ],
  returnToRunCriteria: [
    "Pain-free walking for 45 minutes",
    "Single-leg calf raise: 20 consecutive reps without pain",
    "Two consecutive weeks of symptom-free running",
    "No night pain or resting shin ache",
  ],
  preventionTips: [
    "Follow the 10% weekly volume increase rule",
    "Rotate shoe models and replace footwear at 600–800 km",
    "Introduce downhill running gradually",
    "Include tibialis anterior and calf strengthening year-round",
    "Monitor weekly training load and avoid sudden mileage spikes",
  ],
  redFlagSymptoms: [
    "Point-tender area of bone that is exquisitely painful to touch",
    "Pain at rest or that wakes you at night",
    "Visible swelling over the tibial shaft",
    "Symptoms not improving after 2 weeks of relative rest",
  ],
  nutritionFocus: [
    "Calcium: 1000–1200 mg/day from dairy, leafy greens or supplementation",
    "Vitamin D: 1000–2000 IU/day to support bone remodelling",
    "Protein: 1.6–2.0 g/kg body weight to support tissue repair",
    "Iron: Monitor ferritin levels — low iron is associated with stress injuries in female runners",
  ],
};

const RUNNERS_KNEE_PROTOCOL: InjuryProtocol = {
  condition: "Runner's Knee (PFPS)",
  bodyRegion: "knee",
  overview:
    "Patellofemoral Pain Syndrome (PFPS) causes pain around or behind the kneecap, typically aggravated by downhill running, stairs, and prolonged sitting. It is driven by weakness in the quadriceps and hip abductors that causes poor patellar tracking. Most cases resolve within 4–8 weeks with targeted strengthening.",
  typicalRecoveryDays: { mild: 21, moderate: 42, severe: 60 },
  phases: [
    {
      phase: "Phase 1: Pain Control & Quad Activation",
      durationDays: "5–10 days",
      goal: "Reduce pain, activate VMO and quad, avoid further aggravation",
      exercises: [
        {
          name: "Terminal Knee Extensions (TKE)",
          sets: "3 sets of 15",
          frequency: "Daily",
          cue: "Use a resistance band behind the knee; squeeze quad at full extension",
          progressionNote: "Increase band resistance once 20 reps feel easy",
        },
        {
          name: "Step-Downs (controlled)",
          sets: "3 sets of 10 each leg",
          frequency: "Daily",
          cue: "Lower slowly over 3 seconds; keep knee tracking over second toe",
          progressionNote: "Increase step height once movement is pain-free",
        },
        {
          name: "Straight-Leg Raises",
          sets: "3 sets of 15",
          frequency: "Daily",
          cue: "Tighten quad before lifting; keep leg straight",
          progressionNote: "Add ankle weight when 20 reps are pain-free",
        },
      ],
      runningGuidance:
        "No running. Avoid deep knee flexion (>90°), stairs, and squatting.",
      redFlags: [
        "Significant knee swelling or warmth",
        "Locking or giving-way of the knee",
        "Pain at rest that is not improving",
      ],
    },
    {
      phase: "Phase 2: Hip & Quad Strengthening",
      durationDays: "10–21 days",
      goal: "Build hip abductor and external rotator strength to improve patellar mechanics",
      exercises: [
        {
          name: "Single-Leg Squats (shallow)",
          sets: "3 sets of 10 each leg",
          frequency: "Daily",
          cue: "Keep knee over second toe; do not let knee cave inward",
          progressionNote: "Increase depth gradually as control improves",
        },
        {
          name: "Lateral Band Walks",
          sets: "3 sets of 15 steps each direction",
          frequency: "Daily",
          cue: "Maintain slight knee bend; step sideways with even tension",
          progressionNote: "Increase band resistance every 5–7 days",
        },
        {
          name: "Hip Abductor Strengthening (side-lying)",
          sets: "3 sets of 20",
          frequency: "Daily",
          cue: "Keep hips stacked; do not roll back when lifting",
          progressionNote: "Progress to clamshells with band, then standing variations",
        },
      ],
      runningGuidance:
        "Begin flat, easy runs if Phase 1 exercises are pain-free. Avoid downhill running and stairs at pace.",
      redFlags: [
        "Pain during single-leg squat that does not resolve",
        "Knee swelling following any exercise session",
      ],
    },
    {
      phase: "Phase 3: Return to Full Running",
      durationDays: "14–28 days",
      goal: "Progressively reload with running; introduce hills only when fully pain-free",
      exercises: [
        {
          name: "Decline Single-Leg Squats",
          sets: "3 sets of 12",
          frequency: "3x/week",
          cue: "Use a 10–15° decline board; controlled slow descent",
          progressionNote: "Add load (weighted vest or dumbbells) when bodyweight is easy",
        },
        {
          name: "Running Cadence Drill",
          sets: "5 min within each run",
          frequency: "Each run",
          cue: "Aim for 170–180 steps/min; shorter ground contact reduces patellar stress",
          progressionNote: "Use a metronome app to dial in cadence",
        },
      ],
      runningGuidance:
        "Flat surface running first; introduce gentle uphills before any downhill. Increase volume by 10% per week. Avoid track banking and cambered roads.",
      redFlags: [
        "Anterior knee pain during or after runs exceeding 3/10",
        "Pain descending stairs or hills that is worsening",
      ],
    },
  ],
  trainingModifications: [
    {
      appliesTo: ["severe"],
      rule: "No running — cycling and swimming are suitable alternatives",
      reason: "Eliminates patellofemoral joint compression while maintaining aerobic fitness",
    },
    {
      appliesTo: ["moderate"],
      rule: "Flat easy runs only; reduce weekly volume by 40%; no hills or stairs at pace",
      reason: "Minimises patellofemoral compressive load while allowing limited activity",
    },
    {
      appliesTo: ["mild", "monitoring"],
      rule: "Reduce weekly volume by 20%; no downhill running or hill repeats",
      reason: "Descending hills generates the highest patellofemoral joint stress",
    },
  ],
  returnToRunCriteria: [
    "Pain-free on stairs (up and down) without holding the rail",
    "Single-leg squat: 15 consecutive reps without pain or knee cave",
    "1 km walk pain-free on varied terrain",
    "No aching in the knee after sitting for 30+ minutes",
  ],
  preventionTips: [
    "Maintain hip abductor and quad strength year-round",
    "Increase cadence to reduce patellofemoral load",
    "Introduce downhill running gradually",
    "Avoid sudden increases in hill or track work",
    "Address any footwear or gait asymmetries with a physio assessment",
  ],
  redFlagSymptoms: [
    "Knee swelling or effusion (knee feeling puffy or warm)",
    "Locking, clicking with pain, or giving-way of the knee",
    "Pain at the sides of the knee (may indicate meniscus or ligament issue)",
    "Symptoms not improving after 4 weeks of rehab",
  ],
  nutritionFocus: [
    "Collagen peptides + vitamin C: 15 g collagen + 50 mg vitamin C 30–60 min before loading exercises",
    "Omega-3 fatty acids: 2–3 g EPA/DHA daily to reduce joint inflammation",
    "Anti-inflammatory diet: prioritise berries, oily fish, turmeric, and leafy greens",
  ],
};

const IT_BAND_PROTOCOL: InjuryProtocol = {
  condition: "IT Band Syndrome (ITBS)",
  bodyRegion: "knee",
  overview:
    "Iliotibial Band Syndrome causes sharp or burning pain on the outer (lateral) knee, typically appearing at a consistent distance into a run. It is driven by hip abductor weakness, overstriding, and excessive running on cambered roads or downhill. Recovery typically takes 4–8 weeks with hip strengthening and load management.",
  typicalRecoveryDays: { mild: 21, moderate: 42, severe: 60 },
  phases: [
    {
      phase: "Phase 1: Reduce Irritation",
      durationDays: "5–10 days",
      goal: "Reduce friction and inflammation at the lateral knee; address hip weakness",
      exercises: [
        {
          name: "Foam Rolling — Lateral Hip and TFL",
          sets: "2 min each side",
          frequency: "Daily",
          cue: "Roll the lateral hip and TFL only — avoid rolling directly on the IT band itself",
          progressionNote: "Reduce frequency once hip mobility improves",
        },
        {
          name: "Hip Abductor Strengthening (side-lying)",
          sets: "3 sets of 20",
          frequency: "Daily",
          cue: "Keep top leg straight; do not let the pelvis drop backward",
          progressionNote: "Progress to banded variations when 20 reps feel easy",
        },
        {
          name: "Glute Medius Activation (standing hip abduction)",
          sets: "3 sets of 15",
          frequency: "Daily",
          cue: "Stand tall; lift leg directly to the side without leaning",
          progressionNote: "Add resistance band at ankles for progression",
        },
      ],
      runningGuidance:
        "No running. Avoid downhill walking. Cycling on a stationary bike with saddle raised is acceptable.",
      redFlags: [
        "Lateral knee pain at rest",
        "Swelling at the lateral knee joint line",
        "Pain that does not improve with 7 days of rest",
      ],
    },
    {
      phase: "Phase 2: Hip Load & Mobility",
      durationDays: "10–21 days",
      goal: "Build meaningful hip abductor strength and lateral hip mobility",
      exercises: [
        {
          name: "Side-Lying Clam",
          sets: "3 sets of 20",
          frequency: "Daily",
          cue: "Feet together; rotate top knee upward like a clam; do not rock the pelvis",
          progressionNote: "Add resistance band above the knee",
        },
        {
          name: "Lateral Band Walks",
          sets: "3 sets of 15 steps each direction",
          frequency: "Daily",
          cue: "Mini squat position; maintain hip-width stance throughout",
          progressionNote: "Increase band resistance every 5 days",
        },
        {
          name: "Lateral Hip Mobility — 90/90 Stretch",
          sets: "2 min each side",
          frequency: "Daily",
          cue: "Sit in 90/90 position; lean gently toward front shin to open lateral hip",
          progressionNote: "Aim for symmetric hip mobility before Phase 3",
        },
      ],
      runningGuidance:
        "Flat, short runs (under 20 min) may begin if lateral knee is pain-free on walking. Stop immediately if the pain reappears at any point.",
      redFlags: [
        "Lateral knee pain within first 5 min of running",
        "Pain that gets worse during a run",
      ],
    },
    {
      phase: "Phase 3: Gradual Return",
      durationDays: "14–28 days",
      goal: "Restore full running load with attention to road camber and downhill",
      exercises: [
        {
          name: "Single-Leg Romanian Deadlift",
          sets: "3 sets of 10 each leg",
          frequency: "3x/week",
          cue: "Hinge at hip; keep a neutral spine; loaded glute med and hip",
          progressionNote: "Add weight when single-leg balance and control are solid",
        },
        {
          name: "Running Gait Focus: Cadence",
          sets: "Incorporated into runs",
          frequency: "Each run",
          cue: "Slightly shorter stride, higher cadence reduces IT band strain",
          progressionNote: "Target 175–180 spm for optimal IT band load distribution",
        },
      ],
      runningGuidance:
        "Avoid cambered roads (run in the centre of a flat road). No downhill running until fully symptom-free. Increase weekly volume by 10% only.",
      redFlags: [
        "Return of lateral knee pain at the 'classic' distance trigger point",
        "Pain on stairs or during/after cycling",
      ],
    },
  ],
  trainingModifications: [
    {
      appliesTo: ["severe"],
      rule: "No running — stationary cycling acceptable (saddle raised, flat road only)",
      reason: "Running, downhill, and stair loading all aggravate the IT band friction zone",
    },
    {
      appliesTo: ["moderate"],
      rule: "Flat runs only; reduce weekly volume by 50%; no downhill or cambered roads",
      reason: "Downhill running increases IT band tension dramatically at the knee",
    },
    {
      appliesTo: ["mild", "monitoring"],
      rule: "Reduce weekly volume by 30%; no downhill runs; avoid cambered roads",
      reason: "Maintaining load management prevents the syndrome from becoming acute",
    },
  ],
  returnToRunCriteria: [
    "30-minute flat walk pain-free",
    "Single-leg squat without lateral knee pain",
    "Hip abductor strength equal bilaterally",
    "20-minute flat run without lateral knee pain at any point",
  ],
  preventionTips: [
    "Strengthen hip abductors and glute med year-round",
    "Avoid running on cambered road surfaces",
    "Introduce downhill running gradually (no more than 5% of total volume)",
    "Ensure adequate hip mobility alongside strength work",
    "Rotate training surfaces and shoes",
  ],
  redFlagSymptoms: [
    "Lateral knee pain that comes on within the first kilometre (was previously only later in runs — suggests worsening)",
    "Joint line swelling or effusion",
    "Pain at rest in the lateral knee",
  ],
  nutritionFocus: [
    "Omega-3 fatty acids: 2–3 g EPA/DHA daily for tendon and connective tissue inflammation",
    "Collagen + vitamin C before loading sessions to support connective tissue adaptation",
    "Maintain overall caloric intake to support tissue repair",
  ],
};

const PLANTAR_FASCIITIS_PROTOCOL: InjuryProtocol = {
  condition: "Plantar Fasciitis",
  bodyRegion: "foot-ankle",
  overview:
    "Plantar fasciitis is a degenerative irritation of the plantar fascia at its heel attachment. The hallmark symptom is intense pain on the first steps in the morning. It is driven by calf tightness, intrinsic foot weakness, and excessive training load. With consistent stretching, strengthening, and load management most runners recover in 6–12 weeks.",
  typicalRecoveryDays: { mild: 42, moderate: 84, severe: 180 },
  phases: [
    {
      phase: "Phase 1: Offload & Stretch",
      durationDays: "7–14 days",
      goal: "Reduce morning pain and plantar fascia load",
      exercises: [
        {
          name: "Plantar Fascia Stretch (seated, first thing in morning)",
          sets: "3 × 30-second holds each foot",
          frequency: "Before first steps every morning",
          cue: "Pull toes back toward shin until tension felt along the arch",
          progressionNote: "Must be done before standing after sleep or prolonged sitting",
        },
        {
          name: "Frozen Water Bottle Rolling",
          sets: "5 min per foot",
          frequency: "Daily",
          cue: "Moderate pressure; roll from heel to ball of foot",
          progressionNote: "Transition to foot strengthening exercises after 2 weeks",
        },
        {
          name: "Standing Calf Stretch (straight knee)",
          sets: "3 × 30-second holds",
          frequency: "3x/day",
          cue: "Back heel stays flat; feel stretch in lower calf and into heel",
          progressionNote: "Add bent-knee calf stretch (soleus) once straight-knee is comfortable",
        },
      ],
      runningGuidance:
        "No running. Pool running and cycling acceptable. Avoid barefoot walking on hard floors — wear supportive footwear throughout the day.",
      redFlags: [
        "Heel pain at rest (not just on first steps)",
        "Significant heel bruising",
        "Numbness or tingling in the heel (possible nerve involvement)",
      ],
    },
    {
      phase: "Phase 2: Intrinsic Strengthening",
      durationDays: "14–28 days",
      goal: "Strengthen the intrinsic foot muscles and load the plantar fascia progressively",
      exercises: [
        {
          name: "Towel Scrunches",
          sets: "3 sets of 20",
          frequency: "Daily",
          cue: "Use toes to scrunch a towel off the floor; keep heel down",
          progressionNote: "Progress to marble pick-ups or short-foot exercises",
        },
        {
          name: "Calf Raises (bilateral, then unilateral)",
          sets: "3 sets of 15",
          frequency: "Daily",
          cue: "Full range of motion; through the ball of the foot",
          progressionNote: "Progress to single-leg when bilateral is pain-free",
        },
        {
          name: "Short Foot Exercise",
          sets: "3 × 10-second holds each foot",
          frequency: "Daily",
          cue: "Shorten the foot without curling the toes; engage the arch",
          progressionNote: "Begin standing variation once seated is solid",
        },
      ],
      runningGuidance:
        "Begin walk-to-run intervals on flat surfaces only. Keep runs under 20 minutes initially. Wear well-cushioned shoes.",
      redFlags: [
        "Morning pain not improving week-on-week",
        "Pain that persists beyond the first 10 minutes of activity",
      ],
    },
    {
      phase: "Phase 3: Gradual Running Return",
      durationDays: "21–42 days",
      goal: "Return to full running volume; build foot resilience",
      exercises: [
        {
          name: "Single-Leg Calf Raise (full range)",
          sets: "3 sets of 20",
          frequency: "3x/week",
          cue: "Over the edge of a step; full dorsiflexion to plantarflexion",
          progressionNote: "Add weight when bodyweight is easy for 25 reps",
        },
        {
          name: "Progressive Running",
          sets: "Increase by 10% per week",
          frequency: "Every other day",
          cue: "First 5 minutes at easy shuffle pace; build gradually",
          progressionNote: "Delay barefoot or minimalist shoe running until 3 months post-symptoms",
        },
      ],
      runningGuidance:
        "Return to running on cushioned surfaces. No barefoot running. Increase weekly volume by no more than 10%. Avoid early morning hard sessions — heel is most vulnerable on first steps.",
      redFlags: [
        "Morning pain returning after a period of improvement",
        "Pain rated above 3/10 during or after any run",
      ],
    },
  ],
  trainingModifications: [
    {
      appliesTo: ["severe"],
      rule: "No impact activity — pool running and cycling only",
      reason: "Ground reaction forces must be eliminated to allow the plantar fascia to recover",
    },
    {
      appliesTo: ["moderate"],
      rule: "Reduce running volume by 50%; cushioned shoes required; no barefoot or minimalist footwear",
      reason: "Reduces tensile load on the plantar fascia while maintaining training stimulus",
    },
    {
      appliesTo: ["mild", "monitoring"],
      rule: "Reduce running volume by 20%; avoid minimalist shoes and barefoot running",
      reason: "Light load management prevents the condition worsening under training stress",
    },
  ],
  returnToRunCriteria: [
    "Morning pain of 0–1/10 consistently for 2 weeks",
    "Single-leg calf raise: 20 reps without heel pain",
    "30-minute walk pain-free",
    "No post-activity pain flare the morning after exercise",
  ],
  preventionTips: [
    "Wear supportive footwear at all times, especially on first steps in the morning",
    "Maintain calf flexibility with daily stretching",
    "Build intrinsic foot strength year-round",
    "Transition to new shoes or surface types gradually",
    "Avoid dramatic weekly mileage increases",
  ],
  redFlagSymptoms: [
    "Heel pain at rest (not just on first steps in the morning)",
    "Heel pain that is worsening despite 4 weeks of conservative treatment",
    "Numbness, tingling, or burning in the heel (possible tarsal tunnel syndrome)",
    "Inability to weight-bear on the heel",
  ],
  nutritionFocus: [
    "Collagen peptides + vitamin C (15 g + 50 mg, 30 min pre-exercise) to support fascia adaptation",
    "Maintain healthy body weight — each kg of body weight multiplies load on the plantar fascia during running",
    "Magnesium: adequate intake supports muscle and connective tissue recovery",
  ],
};

const ACHILLES_PROTOCOL: InjuryProtocol = {
  condition: "Achilles Tendinopathy",
  bodyRegion: "foot-ankle",
  overview:
    "Achilles tendinopathy is a failed healing response in the tendon caused by overloading relative to tendon capacity. Unlike acute injuries, tendons require progressive LOAD — complete rest weakens the tendon further. The Alfredson eccentric protocol is well-evidenced and forms the cornerstone of rehab. Recovery ranges from 6–12 weeks for mid-portion tendinopathy, longer for insertional.",
  typicalRecoveryDays: { mild: 42, moderate: 84, severe: 180 },
  phases: [
    {
      phase: "Phase 1: Load Management & Eccentric Loading",
      durationDays: "14–21 days",
      goal: "Introduce the Alfredson eccentric protocol to stimulate tendon remodelling",
      exercises: [
        {
          name: "Eccentric Heel Drops — Straight Knee (Alfredson)",
          sets: "3 sets of 15 each leg",
          frequency: "Twice daily",
          cue: "Rise on both feet; lower on one; over the edge of a step; slow 3-second descent",
          progressionNote: "Add weight in a backpack once 15 reps feel easy",
        },
        {
          name: "Eccentric Heel Drops — Bent Knee (soleus emphasis)",
          sets: "3 sets of 15 each leg",
          frequency: "Twice daily",
          cue: "Same as above with a slight knee bend (30°) to target the soleus",
          progressionNote: "Increase reps before adding load",
        },
        {
          name: "Isometric Calf Holds",
          sets: "5 × 45-second holds",
          frequency: "Daily",
          cue: "Rise onto balls of feet; hold position; provides pain relief and load stimulus",
          progressionNote: "Use as a warm-up before running to reduce tendon pain",
        },
      ],
      runningGuidance:
        "No hill running. Minimise total running volume. Flat easy running may continue if pain is under 3/10 during activity and returns to baseline within 24 hours.",
      redFlags: [
        "Sudden, severe calf or Achilles pain during activity (possible rupture)",
        "Inability to rise onto toes on one leg",
        "Visible gap or dent in the Achilles tendon",
      ],
    },
    {
      phase: "Phase 2: Progressive Loading",
      durationDays: "21–42 days",
      goal: "Build tendon strength through the full range of calf function",
      exercises: [
        {
          name: "Concentric-Eccentric Calf Raises",
          sets: "3 sets of 15",
          frequency: "Daily",
          cue: "Rise on one foot; lower on one foot; full range through the step",
          progressionNote: "Add load when 15 single-leg reps are easy",
        },
        {
          name: "Hopping Progression (single leg)",
          sets: "3 × 10 hops each leg",
          frequency: "3x/week",
          cue: "Begin with low-intensity hops on the spot; soft landing",
          progressionNote: "Progress to bounding and skipping when pain-free",
        },
        {
          name: "Straight-Leg Calf Raise with Load",
          sets: "4 sets of 8",
          frequency: "3x/week",
          cue: "Use heavy load; slow tempo 3-1-3 (up-hold-down)",
          progressionNote: "Heavy slow resistance is optimal for tendon remodelling",
        },
      ],
      runningGuidance:
        "Increase running volume by 10% per week if the 24-hour tendon response is settled. No speedwork or hill running yet.",
      redFlags: [
        "Significant tendon swelling or warmth after loading sessions",
        "Pain worsening session-to-session rather than improving",
      ],
    },
    {
      phase: "Phase 3: Return to Full Training",
      durationDays: "21–42 days",
      goal: "Reintroduce speed, hills, and full training volume",
      exercises: [
        {
          name: "Plyometric Progression",
          sets: "4 × 20 m skipping / bounding",
          frequency: "2x/week",
          cue: "Focus on push-off power; monitor tendon response next morning",
          progressionNote: "Introduce continuous running before plyometrics",
        },
        {
          name: "Gradual Hill Reintroduction",
          sets: "Start with uphill only (5% grade)",
          frequency: "Once per week",
          cue: "Uphill running is lower Achilles load than flat; downhill is the highest load",
          progressionNote: "Introduce downhill only when uphill is completely symptom-free",
        },
      ],
      runningGuidance:
        "Full running with 10% weekly volume increases. Introduce speedwork only after 4 consecutive weeks of comfortable full-volume running. Monitor tendon stiffness the morning after hard sessions.",
      redFlags: [
        "Morning stiffness that takes more than 15 min to resolve",
        "Tendon pain above 3/10 during a run",
      ],
    },
  ],
  trainingModifications: [
    {
      appliesTo: ["severe"],
      rule: "No running but daily eccentric loading is essential — complete rest is contraindicated",
      reason: "Tendons respond to progressive load; rest alone causes further tendon degeneration",
    },
    {
      appliesTo: ["moderate"],
      rule: "Reduce running volume by 60%; eliminate all hills and speedwork",
      reason: "Hill running (especially downhill) creates extreme Achilles tendon load",
    },
    {
      appliesTo: ["mild", "monitoring"],
      rule: "Reduce running volume by 30%; no speedwork; no hill running",
      reason: "Maintains training stimulus while managing cumulative tendon stress",
    },
  ],
  returnToRunCriteria: [
    "Single-leg calf raise: 25 reps without tendon pain",
    "Single-leg hop: 10 consecutive hops without tendon pain",
    "Morning tendon stiffness resolving within 5 minutes",
    "24-hour tendon response settled after all exercise sessions",
  ],
  preventionTips: [
    "Never increase weekly volume more than 10% per week",
    "Avoid sudden introduction of hill work or speedwork",
    "Maintain calf and soleus strength year-round",
    "Allow the tendon to warm up before hard running (start easy for 10–15 min)",
    "Monitor morning Achilles stiffness as an early warning signal",
  ],
  redFlagSymptoms: [
    "Sudden pop or snap sensation in the Achilles during activity (possible rupture — seek emergency care)",
    "Inability to stand on tiptoes on the affected side",
    "A visible dent or gap in the tendon",
    "Rapid onset of significant calf swelling",
  ],
  nutritionFocus: [
    "Collagen peptides + vitamin C (15 g + 50 mg) 30–60 min before tendon loading — well-evidenced for tendon repair",
    "Protein: 2.0 g/kg body weight daily to support tendon remodelling",
    "Adequate total calories — under-fuelling severely impairs tendon healing",
  ],
};

const HAMSTRING_PROTOCOL: InjuryProtocol = {
  condition: "Hamstring Strain",
  bodyRegion: "hip-glute",
  overview:
    "Hamstring strains range from mild (Grade 1) to complete rupture (Grade 3) and are among the most common running injuries. Acute strains should not be stretched in the first 48 hours — ice, compression, and gentle range-of-motion exercises are the priority. Progressive loading with exercises like the Nordic hamstring curl is highly effective at both treating and preventing recurrence.",
  typicalRecoveryDays: { mild: 14, moderate: 42, severe: 90 },
  phases: [
    {
      phase: "Phase 1: Acute Protection (first 48–72 hours)",
      durationDays: "3–5 days",
      goal: "Control bleeding and inflammation; gentle ROM restoration",
      exercises: [
        {
          name: "Active Knee Extension (ROM restoration)",
          sets: "3 sets of 10",
          frequency: "Daily",
          cue: "Lying on back; gently straighten the knee to the point of mild tension only",
          progressionNote: "Increase range only as pain-free range improves",
        },
        {
          name: "Ice and Compression",
          sets: "15 min every 2–3 hours",
          frequency: "First 48 hours",
          cue: "Elevate the leg when possible; compression bandage on the thigh",
          progressionNote: "Transition to gentle heat after 72 hours",
        },
        {
          name: "Isometric Hamstring Holds (pain-free range only)",
          sets: "5 × 10-second holds",
          frequency: "Daily",
          cue: "Gentle resistance; stop well before discomfort",
          progressionNote: "Increase hold duration as pain subsides",
        },
      ],
      runningGuidance:
        "No running. No stretching in the first 48 hours — this causes further microtrauma. Walk only if pain-free.",
      redFlags: [
        "Severe bruising extending to the back of the knee (may indicate high-grade tear)",
        "Complete inability to bear weight",
        "Sharp pain at the sitting bone (ischial tuberosity) — possible proximal avulsion",
      ],
    },
    {
      phase: "Phase 2: Progressive Loading",
      durationDays: "14–28 days",
      goal: "Restore hamstring strength and length through progressive loading",
      exercises: [
        {
          name: "Romanian Deadlift (bilateral)",
          sets: "3 sets of 10",
          frequency: "3x/week",
          cue: "Hinge at hip; neutral spine; feel hamstring tension at the bottom",
          progressionNote: "Progress to single-leg RDL when bilateral is pain-free under load",
        },
        {
          name: "Nordic Hamstring Curl (assisted)",
          sets: "3 sets of 6",
          frequency: "3x/week",
          cue: "Kneel with feet anchored; lower slowly; use hands to push up if needed",
          progressionNote: "Reduce assistance gradually; progress to full eccentric lowering",
        },
        {
          name: "Hamstring Curl (lying, with resistance band)",
          sets: "3 sets of 12",
          frequency: 3 + "x/week",
          cue: "Smooth controlled movement through full range",
          progressionNote: "Increase resistance when 12 reps are comfortable",
        },
      ],
      runningGuidance:
        "Easy jogging (no sprint mechanics) once walking is pain-free and Phase 2 exercises do not provoke pain.",
      redFlags: [
        "Recurrence of sharp pain during any exercise",
        "Hamstring tightness that is getting worse rather than better",
      ],
    },
    {
      phase: "Phase 3: Speed & Return to Full Training",
      durationDays: "14–28 days",
      goal: "Restore full hamstring function including high-speed running mechanics",
      exercises: [
        {
          name: "Acceleration Runs (50% effort)",
          sets: "6 × 40 m",
          frequency: "2x/week",
          cue: "Focus on sprint mechanics — high knees, drive phase; stop if any pull felt",
          progressionNote: "Increase effort by 10% per session over 2–3 weeks",
        },
        {
          name: "Nordic Hamstring Curl (full unassisted)",
          sets: "3 sets of 8",
          frequency: "2x/week",
          cue: "Slow eccentric lowering; use hands only if absolutely necessary",
          progressionNote: "Maintain this exercise year-round to prevent recurrence",
        },
      ],
      runningGuidance:
        "Full easy running, then tempo. Introduce speed sessions only after unassisted Nordic curls are pain-free and mechanics are symmetrical.",
      redFlags: [
        "Any hamstring discomfort at full sprint speed",
        "Asymmetry in sprinting gait suggesting compensation",
      ],
    },
  ],
  trainingModifications: [
    {
      appliesTo: ["severe"],
      rule: "No running for 2–4 weeks; pool running and cycling once pain-free at rest",
      reason: "High-speed running creates extreme hamstring load and risks re-tear",
    },
    {
      appliesTo: ["moderate"],
      rule: "Easy jogging only; no tempo, intervals, or sprinting",
      reason: "High-intensity running places the hamstring under maximum eccentric load",
    },
    {
      appliesTo: ["mild", "monitoring"],
      rule: "Reduce intensity — no speedwork or hill sprints; easy and moderate efforts only",
      reason: "Maintaining load management prevents re-injury at vulnerable spots in healing tissue",
    },
  ],
  returnToRunCriteria: [
    "Walking pain-free with normal gait",
    "Romanian Deadlift with bodyweight load pain-free for 3 sets of 10",
    "Jogging 20 minutes at easy effort without discomfort",
    "Single-leg balance on injured side for 30 seconds without compensation",
  ],
  preventionTips: [
    "Include Nordic hamstring curls in your regular strength programme",
    "Warm up thoroughly before speed sessions",
    "Avoid dramatic increases in sprint volume",
    "Address hip flexor tightness which often increases hamstring load",
    "Progressive sprint programme after any lay-off from high-speed running",
  ],
  redFlagSymptoms: [
    "Sudden severe pain at the sitting bone during sprinting (proximal hamstring avulsion — urgent medical assessment)",
    "Complete inability to bear weight on the leg",
    "Extensive bruising from the thigh to the back of the knee within 24 hours",
  ],
  nutritionFocus: [
    "Protein: 2.0 g/kg body weight to support muscle fibre repair",
    "Creatine monohydrate (5 g/day) has evidence for muscle recovery and may help during early rehabilitation",
    "Anti-inflammatory foods: oily fish, berries, turmeric in the first 2 weeks",
  ],
};

const STRESS_FRACTURE_PROTOCOL: InjuryProtocol = {
  condition: "Stress Fracture (Suspected)",
  bodyRegion: "lower-leg",
  overview:
    "A stress fracture is a small crack in bone caused by repetitive loading exceeding the bone's remodelling capacity. In runners, common sites include the tibia, fibula, metatarsals, and navicular. Unlike shin splints, the pain is typically well-localised to a single point and may be present at rest. IMAGING IS REQUIRED — MRI is the gold standard. Do not run until medically cleared.",
  typicalRecoveryDays: { mild: 42, moderate: 84, severe: 180 },
  phases: [
    {
      phase: "Phase 1: Medical Assessment (Required)",
      durationDays: "Immediate",
      goal: "Obtain diagnosis and imaging before any return to loading",
      exercises: [
        {
          name: "Pool Running / Swimming",
          sets: "30–45 min",
          frequency: "Daily if pain-free",
          cue: "Zero-impact only; maintain aerobic fitness while bone heals",
          progressionNote: "Continue until medical clearance to return to land-based activity",
        },
        {
          name: "Cycling (stationary, low resistance)",
          sets: "20–40 min",
          frequency: "Daily",
          cue: "Only if no pain during or after; avoid if fibula or metatarsal is affected",
          progressionNote: "Physician clearance required before any weight-bearing exercise",
        },
        {
          name: "Upper Body and Core Maintenance",
          sets: "As tolerated",
          frequency: "3–4x/week",
          cue: "Maintain fitness and mental wellbeing through non-impact training",
          progressionNote: "Gradual return to weight-bearing guided by physician",
        },
      ],
      runningGuidance:
        "COMPLETE REST FROM IMPACT ACTIVITY UNTIL MEDICAL CLEARANCE. Do not run, hop, or walk long distances until imaging confirms healing.",
      redFlags: [
        "This injury IS a red flag — see a sports medicine doctor or physiotherapist immediately",
        "Point tenderness on bone that does not resolve with rest",
        "Pain at rest or night pain",
        "High-risk sites: navicular, femoral neck, anterior tibia — these require urgent attention",
      ],
    },
    {
      phase: "Phase 2: Supervised Return (Post-Medical Clearance)",
      durationDays: "28–56 days",
      goal: "Graduated return to weight-bearing and running under medical supervision",
      exercises: [
        {
          name: "Walk-Run Protocol (physician-guided)",
          sets: "Per clinical guidance",
          frequency: "Per clinical guidance",
          cue: "Follow your treating clinician's specific return-to-run programme",
          progressionNote: "Typically 6-week graduated return to running protocol",
        },
        {
          name: "Bone Loading Exercises",
          sets: "As prescribed",
          frequency: "As prescribed",
          cue: "Low-load bone stimulation exercises as directed by physiotherapist",
          progressionNote: "Imaging to confirm healing before full return",
        },
      ],
      runningGuidance:
        "Strictly follow your physician's or physiotherapist's return-to-run protocol. No self-guided return.",
      redFlags: [
        "Any return of localised bone pain during the return programme",
        "New pain in a different location",
      ],
    },
    {
      phase: "Phase 3: Full Return",
      durationDays: "28–56 days",
      goal: "Restore full training load with fracture risk management strategies",
      exercises: [
        {
          name: "Progressive Running",
          sets: "10% volume increase per week",
          frequency: "Per plan",
          cue: "Monitor for any recurrence of localised bone pain",
          progressionNote: "Maintain bone loading exercises long-term",
        },
      ],
      runningGuidance:
        "Conservative 10% weekly volume rule is critical. Introduce hard surfaces gradually. Address all predisposing factors (training load, nutrition, bone health).",
      redFlags: [
        "ANY return of localised bone pain",
        "New stress injury at another site",
      ],
    },
  ],
  trainingModifications: [
    {
      appliesTo: ["severe", "moderate", "mild", "monitoring"],
      rule: "COMPLETE REST from all impact activity until medical clearance",
      reason: "Continued loading risks complete fracture and requires surgical intervention",
    },
  ],
  returnToRunCriteria: [
    "Medical clearance from a sports medicine physician",
    "Imaging confirming fracture healing",
    "Pain-free walking for 30 minutes",
    "Hop test: 10 single-leg hops pain-free on affected side",
  ],
  preventionTips: [
    "Follow the 10% weekly volume rule strictly",
    "Ensure adequate calcium, vitamin D, and total caloric intake",
    "Monitor for low energy availability (LEA) — a major risk factor for bone stress injuries",
    "Rotate running shoes and vary training surfaces",
    "Include strength training — bone responds to varied load",
  ],
  redFlagSymptoms: [
    "Point-tender bone that is exquisitely painful to touch (this IS a red flag — see a doctor today)",
    "Night pain or resting bone pain",
    "Pain that has not improved with 2 weeks of complete rest",
    "Navicular, femoral neck, or anterior tibial cortex pain — high-risk sites requiring urgent imaging",
  ],
  nutritionFocus: [
    "Calcium: 1200–1500 mg/day — critical for bone healing (dairy, fortified foods, or supplements)",
    "Vitamin D: 2000–4000 IU/day — essential for calcium absorption and bone remodelling",
    "Protein: 2.0 g/kg body weight — protein is required for bone matrix synthesis",
    "Total caloric intake: energy availability below 30 kcal/kg lean mass/day significantly impairs bone repair",
    "Vitamin K2: supports calcium utilisation in bone tissue",
  ],
};

const LOWER_BACK_PROTOCOL: InjuryProtocol = {
  condition: "Lower Back Pain (Runner-Specific)",
  bodyRegion: "lower-back",
  overview:
    "Runner-specific lower back pain is often driven by hip flexor tightness, weak core stability, and excessive anterior pelvic tilt during running. Most cases are non-specific and respond well to core activation, hip mobility work, and a brief reduction in training load. Red flag screening is important to rule out serious spinal pathology.",
  typicalRecoveryDays: { mild: 14, moderate: 28, severe: 84 },
  phases: [
    {
      phase: "Phase 1: Acute Pain Management & Core Activation",
      durationDays: "5–10 days",
      goal: "Reduce pain, restore lumbar mobility, activate deep core stabilisers",
      exercises: [
        {
          name: "Cat-Cow Mobilisation",
          sets: "3 sets of 10 slow cycles",
          frequency: "Daily",
          cue: "Breathe in on the cow (arch); breathe out on the cat (round); move from the spine",
          progressionNote: "Increase repetitions and range as pain reduces",
        },
        {
          name: "Bird-Dog",
          sets: "3 sets of 8 each side",
          frequency: "Daily",
          cue: "Extend opposite arm and leg simultaneously; maintain neutral spine — do not rotate the hips",
          progressionNote: "Increase hold time from 3 to 10 seconds",
        },
        {
          name: "Pelvic Tilts (lying)",
          sets: "3 sets of 15",
          frequency: "Daily",
          cue: "Flatten lower back to floor; gentle posterior pelvic tilt; engage deep abdominals",
          progressionNote: "Progress to standing pelvic tilts in front of a mirror",
        },
      ],
      runningGuidance:
        "No running in acute phase. Gentle walking on flat surfaces is encouraged to maintain movement.",
      redFlags: [
        "Pain, tingling, or numbness radiating down the leg (sciatica)",
        "Bladder or bowel changes (urgent medical assessment required)",
        "Pain following a fall or traumatic impact",
        "Unexplained significant weight loss",
      ],
    },
    {
      phase: "Phase 2: Stability & Hip Mobility",
      durationDays: "10–21 days",
      goal: "Build core endurance, improve hip mobility, restore functional movement",
      exercises: [
        {
          name: "Dead Bug",
          sets: "3 sets of 8 each side",
          frequency: "Daily",
          cue: "Lower back must stay flat on the floor throughout; slow controlled lowering",
          progressionNote: "Progress to adding resistance band or light weight",
        },
        {
          name: "Glute Bridges (bilateral)",
          sets: "3 sets of 15",
          frequency: "Daily",
          cue: "Drive through heels; squeeze glutes at the top; avoid hyperextending the lower back",
          progressionNote: "Progress to single-leg glute bridge",
        },
        {
          name: "Hip Flexor Stretch (kneeling lunge)",
          sets: "3 × 45-second holds each side",
          frequency: "Daily",
          cue: "Posterior pelvic tilt before lunging forward; feel stretch in front of hip",
          progressionNote: "Add reach overhead for a thoracic extension component",
        },
      ],
      runningGuidance:
        "Short easy flat runs (under 20 min) once Phase 1 exercises are pain-free. Avoid hills and track banking.",
      redFlags: [
        "Leg pain, weakness, or numbness during or after running",
        "Pain that is worsening despite rehab",
      ],
    },
    {
      phase: "Phase 3: Running Return & Form Focus",
      durationDays: "14–28 days",
      goal: "Restore full running load with improved lumbopelvic control and running form",
      exercises: [
        {
          name: "Single-Leg Glute Bridge",
          sets: "3 sets of 12 each leg",
          frequency: "3x/week",
          cue: "Maintain level hips; do not allow pelvis to drop on the unsupported side",
          progressionNote: "Progress to hip thrusts with load",
        },
        {
          name: "Running Cadence and Posture Cue",
          sets: "5-minute focus within each run",
          frequency: "Each run",
          cue: "Slightly forward lean from ankles (not waist); engage core during ground contact",
          progressionNote: "Video your running form to identify anterior pelvic tilt patterns",
        },
        {
          name: "Plank Progression",
          sets: "3 × 30–60 second holds",
          frequency: "3x/week",
          cue: "Maintain neutral spine; do not sag at the hips or elevate the glutes",
          progressionNote: "Advance to side plank and dynamic plank variations",
        },
      ],
      runningGuidance:
        "Gradual return to full volume. Avoid track banking, extreme camber, and uphills in the early stages. Prioritise core engagement and running form.",
      redFlags: [
        "Return of sciatic-type symptoms during or after runs",
        "Pain that is worse in the morning",
      ],
    },
  ],
  trainingModifications: [
    {
      appliesTo: ["severe"],
      rule: "No running until pain-free walking is achieved; avoid all high-impact activity",
      reason: "Running creates repetitive compressive and rotational spinal loading",
    },
    {
      appliesTo: ["moderate"],
      rule: "Short easy flat runs only; no hills, track banking, or long runs; reduce volume by 50%",
      reason: "Reduces spinal compressive loading and minimises lumbopelvic rotational stress",
    },
    {
      appliesTo: ["mild", "monitoring"],
      rule: "Avoid hill running and long runs; reduce volume by 20%; focus on flat easy efforts",
      reason: "Hill running increases hip flexor load and anterior pelvic tilt",
    },
  ],
  returnToRunCriteria: [
    "Pain-free walking for 30 minutes",
    "Bird-dog: 10 reps each side without back pain",
    "Single-leg glute bridge: 12 reps without pelvic drop",
    "No neurological symptoms (no leg pain, tingling, or numbness)",
  ],
  preventionTips: [
    "Include core stability training in your regular programme",
    "Stretch hip flexors daily — particularly before running",
    "Analyse running form for excessive anterior pelvic tilt",
    "Strengthen glutes as the primary lumbar spine protectors",
    "Vary running surface and distance to prevent repetitive overload",
  ],
  redFlagSymptoms: [
    "Pain, numbness, or tingling radiating down one or both legs (seek medical assessment)",
    "Bladder or bowel dysfunction (seek emergency assessment)",
    "Back pain following a fall or trauma",
    "Night pain that wakes you from sleep consistently",
    "Unexplained weight loss alongside back pain",
  ],
  nutritionFocus: [
    "Omega-3 fatty acids: 2–3 g EPA/DHA daily to reduce spinal disc inflammation",
    "Vitamin D and magnesium: support muscle function and nerve health",
    "Stay well-hydrated — spinal discs are primarily composed of water and lose hydration with age and loading",
  ],
};

const GENERIC_PROTOCOL: InjuryProtocol = {
  condition: "General Musculoskeletal Injury",
  bodyRegion: "other",
  overview:
    "A general approach to musculoskeletal injury management. Monitor symptoms carefully and consult a sports medicine professional for a specific diagnosis. Follow general load management principles until condition-specific guidance is available.",
  typicalRecoveryDays: { mild: 14, moderate: 28, severe: 84 },
  phases: [
    {
      phase: "Phase 1: Load Management & Protection",
      durationDays: "3–7 days",
      goal: "Reduce aggravating factors and allow initial recovery",
      exercises: [
        {
          name: "Gentle Range of Motion",
          sets: "3 × 10 gentle movements",
          frequency: "Daily",
          cue: "Move within a pain-free range only",
          progressionNote: "Increase range as pain subsides",
        },
        {
          name: "Ice or Heat (as appropriate)",
          sets: "15 min per session",
          frequency: "2–3x/day",
          cue: "Ice for acute/inflamed; heat for chronic/stiff",
          progressionNote: "Transition when symptoms change",
        },
      ],
      runningGuidance:
        "Reduce running load significantly. Avoid activity that reproduces the pain.",
      redFlags: [
        "Significant swelling or joint effusion",
        "Inability to bear weight",
        "Neurological symptoms (numbness, tingling, weakness)",
      ],
    },
    {
      phase: "Phase 2: Progressive Loading",
      durationDays: "7–21 days",
      goal: "Gradually reintroduce loading with strength exercises",
      exercises: [
        {
          name: "Regional Strengthening",
          sets: "3 sets of 12",
          frequency: "3x/week",
          cue: "Pain-free movement throughout; controlled tempo",
          progressionNote: "Increase load progressively",
        },
      ],
      runningGuidance:
        "Gradual return to easy running with careful monitoring of symptom response.",
      redFlags: [
        "Pain that worsens with loading",
        "New symptoms developing",
      ],
    },
    {
      phase: "Phase 3: Return to Full Training",
      durationDays: "14–28 days",
      goal: "Restore full training load",
      exercises: [
        {
          name: "Sport-Specific Loading",
          sets: "As tolerated",
          frequency: "As tolerated",
          cue: "Progressive and monitored return to running",
          progressionNote: "10% weekly volume rule applies",
        },
      ],
      runningGuidance:
        "Gradual return following the 10% weekly volume increase rule.",
      redFlags: [
        "Any return of initial symptoms at increased load",
      ],
    },
  ],
  trainingModifications: [
    {
      appliesTo: ["severe"],
      rule: "Significant reduction or rest from running as appropriate",
      reason: "Protecting the injured structure from further aggravation",
    },
    {
      appliesTo: ["moderate"],
      rule: "Reduce weekly volume by 40–50%; easy-effort runs only",
      reason: "General load management principle for moderate injury",
    },
    {
      appliesTo: ["mild", "monitoring"],
      rule: "Reduce weekly volume by 20%; monitor symptoms carefully",
      reason: "Early load management prevents injury progression",
    },
  ],
  returnToRunCriteria: [
    "Pain-free at rest and during daily activities",
    "Full range of motion restored",
    "Pain-free walking for 30 minutes",
    "Symptoms not reproduced by gentle running",
  ],
  preventionTips: [
    "Follow the 10% weekly volume increase rule",
    "Include strength training alongside running",
    "Ensure adequate sleep and recovery between hard sessions",
    "Address any biomechanical issues with a physiotherapist",
  ],
  redFlagSymptoms: [
    "Significant joint swelling or effusion",
    "Neurological symptoms (numbness, tingling, weakness)",
    "Symptoms that are not improving after 2–3 weeks of management",
    "Any injury following significant trauma",
  ],
  nutritionFocus: [
    "Adequate protein: 1.6–2.0 g/kg body weight daily",
    "Stay well-hydrated to support tissue recovery",
    "Anti-inflammatory foods: oily fish, berries, leafy greens",
  ],
};

// ----------------------------------------------------------------
// Protocol registry
// ----------------------------------------------------------------

const ALL_PROTOCOLS: InjuryProtocol[] = [
  SHIN_SPLINTS_PROTOCOL,
  RUNNERS_KNEE_PROTOCOL,
  IT_BAND_PROTOCOL,
  PLANTAR_FASCIITIS_PROTOCOL,
  ACHILLES_PROTOCOL,
  HAMSTRING_PROTOCOL,
  STRESS_FRACTURE_PROTOCOL,
  LOWER_BACK_PROTOCOL,
];

type KeywordEntry = { keywords: string[]; protocol: InjuryProtocol };

const KEYWORD_MAP: KeywordEntry[] = [
  {
    keywords: ["shin splints", "mtss", "tibial", "shin", "periosteum"],
    protocol: SHIN_SPLINTS_PROTOCOL,
  },
  {
    keywords: [
      "runner's knee",
      "runners knee",
      "patellofemoral",
      "pfps",
      "kneecap",
      "anterior knee",
    ],
    protocol: RUNNERS_KNEE_PROTOCOL,
  },
  {
    keywords: ["it band", "itbs", "iliotibial", "lateral knee", "it-band"],
    protocol: IT_BAND_PROTOCOL,
  },
  {
    keywords: ["plantar fasciitis", "heel pain", "plantar", "fascia"],
    protocol: PLANTAR_FASCIITIS_PROTOCOL,
  },
  {
    keywords: ["achilles", "tendon", "tendinopathy", "tendinitis"],
    protocol: ACHILLES_PROTOCOL,
  },
  {
    keywords: ["hamstring", "hamstrings", "posterior thigh"],
    protocol: HAMSTRING_PROTOCOL,
  },
  {
    keywords: [
      "stress fracture",
      "stress reaction",
      "bone stress",
      "fracture",
    ],
    protocol: STRESS_FRACTURE_PROTOCOL,
  },
  {
    keywords: [
      "back",
      "lumbar",
      "lower back",
      "lumbopelvic",
      "spine",
      "sacral",
    ],
    protocol: LOWER_BACK_PROTOCOL,
  },
];

// ----------------------------------------------------------------
// Public API
// ----------------------------------------------------------------

/**
 * Returns the best-matching InjuryProtocol for a given condition string.
 * Falls back to the generic protocol when no match is found.
 */
export function getInjuryProtocol(
  _bodyRegion: BodyRegion | string,
  condition: string,
  _severity?: InjurySeverity
): InjuryProtocol {
  const lower = condition.toLowerCase();

  for (const entry of KEYWORD_MAP) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      return entry.protocol;
    }
  }

  // Body-region fallback
  if (
    _bodyRegion === "lower-leg" &&
    (lower.includes("shin") || lower.includes("calf"))
  ) {
    return SHIN_SPLINTS_PROTOCOL;
  }
  if (_bodyRegion === "knee") return RUNNERS_KNEE_PROTOCOL;
  if (_bodyRegion === "foot-ankle") return PLANTAR_FASCIITIS_PROTOCOL;
  if (_bodyRegion === "hip-glute") return HAMSTRING_PROTOCOL;
  if (_bodyRegion === "lower-back") return LOWER_BACK_PROTOCOL;

  return GENERIC_PROTOCOL;
}

/**
 * Returns a return-to-run estimate based on injury severity and onset type.
 */
export function getReturnToRunEstimate(injury: Injury): ReturnToRunEstimate {
  if (injury.onset_type === "post-surgery") {
    return {
      minDays: 90,
      maxDays: 180,
      label: "3–6 months (post-surgery)",
      confidence: "Consult your surgeon — timelines vary significantly by procedure",
      milestones: [
        "Surgical wound fully healed",
        "Medical clearance for weight-bearing",
        "Supervised physiotherapy programme completed",
        "Return-to-run testing cleared by surgeon",
      ],
    };
  }

  const protocol = getInjuryProtocol(
    injury.body_region,
    injury.condition,
    injury.severity
  );

  const base = protocol.typicalRecoveryDays;

  let minDays: number;
  let maxDays: number;

  switch (injury.severity) {
    case "severe":
      minDays = base.severe * 0.8;
      maxDays = base.severe * 1.4;
      break;
    case "moderate":
      minDays = base.moderate * 0.7;
      maxDays = base.moderate * 1.3;
      break;
    case "mild":
      minDays = base.mild * 0.7;
      maxDays = base.mild * 1.3;
      break;
    default: // monitoring
      minDays = 7;
      maxDays = 21;
  }

  // Acute onset = slightly longer recovery than gradual
  if (injury.onset_type === "acute") {
    minDays = Math.round(minDays * 1.1);
    maxDays = Math.round(maxDays * 1.1);
  }

  minDays = Math.round(minDays);
  maxDays = Math.round(maxDays);

  const weeksMin = Math.round(minDays / 7);
  const weeksMax = Math.round(maxDays / 7);
  const label =
    weeksMin === weeksMax
      ? `~${weeksMin} week${weeksMin !== 1 ? "s" : ""}`
      : `${weeksMin}–${weeksMax} weeks`;

  return {
    minDays,
    maxDays,
    label,
    confidence: `Based on typical recovery for ${injury.severity} ${protocol.condition}`,
    milestones: protocol.returnToRunCriteria.slice(0, 4),
  };
}

/**
 * Merges all active injury modifications into a combined list, taking the
 * most restrictive rule where multiple injuries overlap.
 */
export function getTrainingModifications(
  injuries: Injury[]
): ActiveModification[] {
  const activeInjuries = injuries.filter(
    (i) => i.status === "current" || i.status === "recovering"
  );

  if (activeInjuries.length === 0) return [];

  const modifications: ActiveModification[] = [];

  // Severity rank for comparison: higher = more restrictive
  const severityRank: Record<InjurySeverity, number> = {
    monitoring: 0,
    mild: 1,
    moderate: 2,
    severe: 3,
  };

  // Collect all applicable modification rules
  for (const injury of activeInjuries) {
    const protocol = getInjuryProtocol(
      injury.body_region,
      injury.condition,
      injury.severity
    );

    for (const mod of protocol.trainingModifications) {
      if (mod.appliesTo.includes(injury.severity)) {
        modifications.push({
          rule: mod.rule,
          reason: `${injury.condition} (${injury.severity})`,
          severity:
            severityRank[injury.severity] >= 2 ? "critical" : "warning",
        });
      }
    }
  }

  // De-duplicate by picking the most restrictive where rules overlap
  // Simple approach: if any critical exists, flag as critical overall
  const seen = new Set<string>();
  const deduped: ActiveModification[] = [];

  for (const mod of modifications) {
    // Use first 40 chars as a rough dedup key
    const key = mod.rule.substring(0, 40);
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(mod);
    } else {
      // Replace if current is more severe
      const existingIndex = deduped.findIndex((d) =>
        d.rule.substring(0, 40) === key
      );
      if (
        existingIndex >= 0 &&
        mod.severity === "critical" &&
        deduped[existingIndex].severity === "warning"
      ) {
        deduped[existingIndex] = mod;
      }
    }
  }

  return deduped;
}

/**
 * Given a severity, return the index of the recommended rehab phase:
 *   severe = Phase 1 (index 0)
 *   moderate = Phase 2 (index 1)
 *   mild or monitoring = Phase 3 (index 2, last phase)
 *
 * If the injury status is 'recovering', bump up one phase if possible.
 */
export function getRecommendedPhaseIndex(
  severity: InjurySeverity,
  status: "current" | "recovering" | "historical",
  phases: RehabPhase[]
): number {
  const lastIndex = phases.length - 1;

  let base: number;
  switch (severity) {
    case "severe":
      base = 0;
      break;
    case "moderate":
      base = Math.min(1, lastIndex);
      break;
    default: // mild, monitoring
      base = Math.min(2, lastIndex);
  }

  // If recovering, advance by one phase
  if (status === "recovering") {
    base = Math.min(base + 1, lastIndex);
  }

  return base;
}

// Re-export all protocols so the UI can enumerate them if needed
export { ALL_PROTOCOLS };
