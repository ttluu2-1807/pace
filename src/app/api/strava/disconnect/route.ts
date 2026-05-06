import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin

  if (error || !user) {
    return NextResponse.redirect(`${baseUrl}/login`)
  }

  await supabase.from("strava_connections").delete().eq("user_id", user.id)

  return NextResponse.redirect(
    `${baseUrl}/settings/integrations?disconnected=strava`
  )
}
