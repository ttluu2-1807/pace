import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { exchangeStravaCode } from "@/lib/strava"

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin

  if (error || !code) {
    console.error("[Strava callback] OAuth error:", error)
    return NextResponse.redirect(
      `${baseUrl}/settings/integrations?error=strava_denied`
    )
  }

  // Verify auth
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.redirect(`${baseUrl}/login`)
  }

  try {
    // Exchange code for tokens
    const tokens = await exchangeStravaCode(code)

    const expiresAt = new Date(tokens.expires_at * 1000).toISOString()
    const athleteName = `${tokens.athlete.firstname} ${tokens.athlete.lastname}`.trim()

    // Upsert connection record
    const { error: dbError } = await supabase
      .from("strava_connections")
      .upsert(
        {
          user_id: user.id,
          strava_athlete_id: tokens.athlete.id,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: expiresAt,
          athlete_name: athleteName,
          athlete_firstname: tokens.athlete.firstname,
          athlete_profile_url: tokens.athlete.profile,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )

    if (dbError) {
      console.error("[Strava callback] DB upsert error:", dbError)
      return NextResponse.redirect(
        `${baseUrl}/settings/integrations?error=strava_db`
      )
    }

    // Redirect to integrations page — client will auto-trigger sync
    return NextResponse.redirect(
      `${baseUrl}/settings/integrations?connected=strava`
    )
  } catch (err) {
    console.error("[Strava callback] Unexpected error:", err)
    return NextResponse.redirect(
      `${baseUrl}/settings/integrations?error=strava_failed`
    )
  }
}
