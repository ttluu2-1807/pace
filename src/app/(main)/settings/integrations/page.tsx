import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { StravaConnect } from "@/components/settings/StravaConnect"
import { ArrowLeft } from "react-feather"
import Link from "next/link"

export default async function IntegrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const params = await searchParams

  // Load Strava connection if exists
  const { data: stravaConnection } = await supabase
    .from("strava_connections")
    .select("athlete_name, athlete_profile_url, last_synced_at")
    .eq("user_id", user.id)
    .maybeSingle()

  const bannerMessage =
    params.connected === "strava"
      ? "✓ Strava connected! Your last 90 days of runs are being imported."
      : params.error === "strava_denied"
        ? "Strava connection was cancelled."
        : params.error
          ? "Something went wrong connecting Strava. Please try again."
          : null

  const isSuccess = params.connected === "strava"

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="p-2 rounded-xl hover:bg-muted transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold">Integrations</h1>
          <p className="text-sm text-muted-foreground">
            Connect your devices and apps
          </p>
        </div>
      </div>

      {/* Banner */}
      {bannerMessage && (
        <div
          className={`rounded-xl px-4 py-3 text-sm font-medium ${
            isSuccess
              ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
              : "bg-destructive/10 text-destructive"
          }`}
        >
          {bannerMessage}
        </div>
      )}

      {/* Strava */}
      <StravaConnect
        connected={!!stravaConnection}
        athleteName={stravaConnection?.athlete_name}
        profileUrl={stravaConnection?.athlete_profile_url}
        lastSyncedAt={stravaConnection?.last_synced_at}
        autoSync={params.connected === "strava"}
      />

      {/* Coming soon */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
          Coming Soon
        </p>

        {[
          {
            name: "Apple Health",
            desc: "Import HRV, sleep & heart rate from Apple Watch",
            color: "bg-red-500",
            icon: (
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
            ),
          },
          {
            name: "Garmin Connect",
            desc: "Sync GPS runs, VO₂max & training load",
            color: "bg-[#009CDE]",
            icon: (
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
              </svg>
            ),
          },
          {
            name: "Oura Ring",
            desc: "Import sleep stages & readiness score",
            color: "bg-zinc-800",
            icon: (
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                <path d="M12 2a10 10 0 100 20A10 10 0 0012 2zm0 18a8 8 0 110-16 8 8 0 010 16zm0-12a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
            ),
          },
        ].map((item) => (
          <div
            key={item.name}
            className="rounded-2xl border border-border bg-card p-5 opacity-60"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center flex-shrink-0`}
              >
                {item.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{item.name}</h3>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <span className="text-xs text-muted-foreground border border-border rounded-full px-2 py-0.5">
                Soon
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
