import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

function isSafeRedirect(url: string): boolean {
  return url.startsWith("/") && !url.startsWith("//") && !url.startsWith("\\\\")
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"

  // Validate redirect target to prevent open redirect attacks
  const safeNext = isSafeRedirect(next) ? next : "/"

  if (code) {
    const supabase = await createClient()
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) {
        return NextResponse.redirect(`${origin}${safeNext}`)
      }
    } catch (err) {
      console.error("Auth callback error:", err)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_error`)
}
