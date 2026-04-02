# PACE — Changelog

All notable changes to this project. Most recent first.

---

## [Current] — Live at https://pace-wheat.vercel.app

### Deployed
- Vercel production deployment configured
- Environment variables set (Supabase + Anthropic)
- GitHub repo: https://github.com/ttluu2-1807/pace

---

## Sprint 2 — Feature Enhancements

### Added
- **Running icons on day blocks** — React Feather `Activity` icon appears on days with scheduled runs in both the DaySelector strip and WeeklyCalendar. Completed days show a green ✓, scheduled-but-not-done shows the activity icon.
- **Save to My Foods** — Manual food entry now has a "Save to My Foods" toggle. Saved foods appear at the top of every future search, filtered by query when actively searching. Delete saved foods from search view.
- **Weekly volume chart** — Training tab now has a planned vs actual km bar chart (Recharts) showing progress across all completed weeks of the plan.
- **Multi-plan architecture** — Plans now have status: `active | paused | completed | archived`. Active plan shows Pause and Complete buttons. Past plans appear in a Plan History section with Reactivate option. Creating a new plan pauses the existing one rather than deleting it.
- **Fixed action button confusion** — Dashboard action buttons now have clear, context-aware labels:
  - Future day + no workout → "Plan a Run"
  - Future day + has workout → Modify / Rest Day only (can't log a future run)
  - Today + has workout → "Start Session"
  - Past day + has workout → "Log Past Session"
  - Today/past + no workout → "Log a Run"
  - Removed the always-visible duplicate "Log a Run" button

### Fixed
- Day selector blocks now use `grid grid-cols-7` — fills full width on mobile with even spacing, no dead space on the right
- Saved foods correctly appear when searching (previously hidden when query was active)

### Database migrations added
- `003_custom_foods.sql` — custom_foods table with RLS
- `004_plan_status.sql` — status column on training_plans

---

## Sprint 1 — Foundation

### Added
- Next.js 16 App Router project setup
- Supabase auth (email/password signup, login, onboarding)
- User profile with running preferences and coaching voice settings
- Training plan creation with race type, race date, total weeks
- Auto-generated workout schedule (Base/Build/Peak/Taper phases)
- Daily Brief dashboard with:
  - Day selector navigation
  - Readiness banner (green/amber/red)
  - Today's session card with workout details
  - Pre-run fuelling recommendations
  - Post-run recovery card
  - Weekly calendar strip
  - Tomorrow preview footer
- Daily intelligence engine (16 rules) for alerts and coaching notes
- Session logging (duration, distance, heart rate, notes)
- Workout modification modal
- Rest day conversion
- Nutrition tracking (macros + micronutrients)
- Food search via OpenFoodFacts API
- Manual food entry
- Injury reporting and tracking
- Injury risk scoring
- Weekly check-in form
- Analytics page with readiness scores
- AI coach panel (Claude-powered)
- Mobile-first layout with bottom navigation
- Desktop sidebar

---

## Roadmap (not yet built)

| Feature | Priority | Notes |
|---|---|---|
| Garmin / Strava sync | High | Real workout data import |
| Apple Health integration | High | HR, sleep, HRV data |
| Push notifications | Medium | Daily brief reminders |
| Offline support | Medium | PWA / service worker |
| Race calendar | Medium | Multiple upcoming races |
| Social / sharing | Low | Share weekly summaries |
| Coach voice calls | Low | Audio coaching via AI |
