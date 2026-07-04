import { createClient } from "@/lib/supabase/server"
import { ProjectCard } from "@/components/feed/project-card"
import { ProjectFeedTabs } from "@/components/feed/project-feed-tabs"
import type { Project } from "@/types/database"

async function getProjects(filter: "public" | "private"): Promise<Project[]> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  let profileId: string | null = null
  let isProfessional = false
  if (user) {
    const { data: pd } = await supabase.from("profiles").select("id, role").eq("user_id", user.id).single()
    profileId = pd?.id || null
    isProfessional = pd?.role === "professional"
  }

  let query = supabase
    .from("projects")
    .select(`
      *,
      profiles:user_id (id, full_name, avatar_url, university_or_firm, role, verified_professional),
      project_images (id, url, caption, sort_order),
      reviews (id, overall_rating),
      likes (id, user_id)
    `)
    .order("created_at", { ascending: false })
    .limit(30)

  if (filter === "private") {
    query = query.eq("visibility", "private")
  } else {
    query = query.eq("visibility", "public")
  }

  const { data: projects, error } = await query

  if (error || !projects) return []

  return projects.map((p: Record<string, unknown>) => {
    const likes = (p.likes as Array<{ id: string; user_id: string }>) || []
    const reviews = (p.reviews as Array<{ id: string; overall_rating: number }>) || []
    const images = (p.project_images as Array<{ id: string; url: string; caption: string | null; sort_order: number }>) || []

    const ratings = reviews.map((r) => r.overall_rating).filter((r) => r != null)
    const avgRating = ratings.length > 0
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : null

    return {
      ...p,
      like_count: likes.length,
      review_count: reviews.length,
      user_has_liked: profileId ? likes.some((l) => l.user_id === profileId) : false,
      liked_by_profile_ids: likes.map((l) => l.user_id),
      avg_rating: avgRating,
      cover_image_url: [...images].sort((a, b) => a.sort_order - b.sort_order)[0]?.url || p.cover_image_url,
    } as Project
  })
}

export async function ProjectFeed() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let isProfessional = false
  if (user) {
    const { data: pd } = await supabase.from("profiles").select("role").eq("user_id", user.id).single()
    isProfessional = pd?.role === "professional"
  }

  const publicProjects = await getProjects("public")

  return (
    <ProjectFeedTabs
      publicProjects={publicProjects}
      isProfessional={isProfessional}
    />
  )
}
