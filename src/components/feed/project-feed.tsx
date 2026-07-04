import { createClient } from "@/lib/supabase/server"
import { ProjectCard } from "@/components/feed/project-card"
import { ProjectFeedTabs } from "@/components/feed/project-feed-tabs"
import type { Project } from "@/types/database"

async function getProjectsAndProfile() {
  const supabase = await createClient()

  // Single auth lookup — shared between feed + getProjects
  const { data: { user } } = await supabase.auth.getUser()
  let profileId: string | null = null
  let isProfessional = false
  if (user) {
    const { data: pd } = await supabase.from("profiles").select("id, role").eq("user_id", user.id).single()
    profileId = pd?.id || null
    isProfessional = pd?.role === "professional"
  }

  const { data: projects, error } = await supabase
    .from("projects")
    .select(`
      *,
      profiles:user_id (id, full_name, avatar_url, university_or_firm, role, verified_professional),
      project_images (id, url, caption, sort_order),
      reviews (id, overall_rating),
      likes (id, user_id)
    `)
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(30)

  if (error || !projects) return { publicProjects: [], isProfessional, profileId }

  const mapped = projects.map((p: Record<string, unknown>) => {
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

  return { publicProjects: mapped, isProfessional, profileId }
}

export async function ProjectFeed() {
  const { publicProjects, isProfessional } = await getProjectsAndProfile()

  return (
    <ProjectFeedTabs
      publicProjects={publicProjects}
      isProfessional={isProfessional}
    />
  )
}
