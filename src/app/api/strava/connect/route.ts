import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getStravaAuthUrl } from "@/lib/strava"

export async function GET(request: NextRequest) {
  // Must be authenticated
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
  const redirectUri = `${baseUrl}/api/strava/callback`
  const authUrl = getStravaAuthUrl(redirectUri)

  return NextResponse.redirect(authUrl)
}
