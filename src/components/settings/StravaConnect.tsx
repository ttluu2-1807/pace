"use client"

import { useState, useEffect } from "react"
import { CheckCircle, RefreshCw, XCircle, Zap } from "react-feather"

interface SyncResult {
  imported: number
  matched: number  // planned workouts completed via Strava
  skipped: number
  total: number
  totalActivities: number
  activityTypes?: string[]
  isFirstSync?: boolean
}

interface StravaConnectProps {
  connected: boolean
  athleteName?: string | null
  profileUrl?: string | null
  lastSyncedAt?: string | null
  autoSync?: boolean // true when landing from OAuth callback
}

export function StravaConnect({
  connected,
  athleteName,
  profileUrl,
  lastSyncedAt,
  autoSync = false,
}: StravaConnectProps) {
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Auto-trigger sync when arriving from OAuth (replaces unreliable server-side background fetch)
  useEffect(() => {
    if (connected && autoSync) {
      handleSync()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSync() {
    setSyncing(true)
    setError(null)
    setSyncResult(null)
    try {
      const res = await fetch("/api/strava/sync", { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Sync failed")
      setSyncResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed")
    } finally {
      setSyncing(false)
    }
  }

  const lastSynced = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleDateString("en-AU", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-[#FC4C02] flex items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
            <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Strava</h3>
          <p className="text-xs text-muted-foreground">Auto-import runs from Strava</p>
        </div>
        {connected && (
          <span className="ml-auto flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400 px-2 py-1 rounded-full">
            <CheckCircle size={11} />
            Connected
          </span>
        )}
      </div>

      {connected ? (
        <div className="space-y-3">
          {/* Athlete info */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50">
            {profileUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profileUrl}
                alt={athleteName ?? "Strava athlete"}
                className="w-8 h-8 rounded-full object-cover"
              />
            )}
            <div>
              <p className="text-sm font-medium">{athleteName}</p>
              {lastSynced && !syncing && !syncResult && (
                <p className="text-xs text-muted-foreground">Last synced {lastSynced}</p>
              )}
              {syncing && (
                <p className="text-xs text-muted-foreground animate-pulse">Importing your runs…</p>
              )}
            </div>
          </div>

          {/* Sync result */}
          {syncResult && (
            <div className="rounded-xl bg-muted/50 p-3 space-y-1">
              {(syncResult.imported > 0 || syncResult.matched > 0) ? (
                <div className="space-y-0.5">
                  {syncResult.matched > 0 && (
                    <p className="text-xs font-medium text-green-600 dark:text-green-400">
                      ✓ {syncResult.matched} planned workout{syncResult.matched !== 1 ? "s" : ""} completed from Strava
                    </p>
                  )}
                  {syncResult.imported > 0 && (
                    <p className="text-xs font-medium text-green-600 dark:text-green-400">
                      ✓ {syncResult.imported} new run{syncResult.imported !== 1 ? "s" : ""} imported
                    </p>
                  )}
                  {syncResult.skipped > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {syncResult.skipped} already logged
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs font-medium text-muted-foreground">
                  No new runs found
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {syncResult.totalActivities} total activit{syncResult.totalActivities !== 1 ? "ies" : "y"} fetched
                {syncResult.total !== syncResult.totalActivities
                  ? ` · ${syncResult.total} run${syncResult.total !== 1 ? "s" : ""} identified`
                  : ""}
              </p>
              {syncResult.totalActivities === 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  No activities found in the last 12 months on your Strava account.
                </p>
              )}
            </div>
          )}

          {error && <p className="text-xs text-destructive">{error}</p>}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
            >
              <RefreshCw size={12} className={syncing ? "animate-spin" : ""} />
              {syncing ? "Syncing…" : "Sync Now"}
            </button>
            <a
              href="/api/strava/disconnect"
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground"
            >
              <XCircle size={12} />
              Disconnect
            </a>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Connect Strava to automatically import your runs — no more manual logging.
          </p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li className="flex items-center gap-1.5">
              <Zap size={11} className="text-primary" />
              Last 12 months of runs imported on connect
            </li>
            <li className="flex items-center gap-1.5">
              <Zap size={11} className="text-primary" />
              New activities sync on demand
            </li>
            <li className="flex items-center gap-1.5">
              <Zap size={11} className="text-primary" />
              Distance, duration &amp; effort mapped to PACE
            </li>
          </ul>
          <a
            href="/api/strava/connect"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FC4C02] text-white text-sm font-semibold hover:bg-[#e04402] transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
              <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
            </svg>
            Connect with Strava
          </a>
        </div>
      )}
    </div>
  )
}
