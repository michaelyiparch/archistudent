import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { RequestsList } from "@/components/review-requests/requests-list"
import type { ReviewRequest } from "@/types/database"

async function getRequests(): Promise<ReviewRequest[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login?redirect=/requests")

  const { data: profile } = await supabase.from("profiles").select("id, role").eq("user_id", user.id).single()
  if (!profile) redirect("/")

  const { data, error } = await supabase
    .from("review_requests")
    .select(`
      *,
      student:student_id (id, full_name, avatar_url, university_or_firm),
      architect:architect_id (id, full_name, avatar_url, university_or_firm),
      project:project_id (id, title, cover_image_url)
    `)
    .or(`student_id.eq.${profile.id},architect_id.eq.${profile.id}`)
    .order("created_at", { ascending: false })

  if (error) return []
  return (data as ReviewRequest[]) || []
}

export default async function RequestsPage() {
  const requests = await getRequests()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let role = "student"
  if (user) {
    const { data: p } = await supabase.from("profiles").select("role").eq("user_id", user.id).single()
    role = p?.role || "student"
  }

  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-2xl font-bold mb-2">Review Requests</h1>
        <p className="text-zinc-500 text-sm mb-8">Manage your private 1-to-1 review requests.</p>
        <RequestsList requests={requests} userRole={role} />
      </main>
    </>
  )
}
