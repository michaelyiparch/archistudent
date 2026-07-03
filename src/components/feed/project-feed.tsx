import { createClient } from "@/lib/supabase/server"
import { ProjectCard } from "@/components/feed/project-card"
import type { Project } from "@/types/database"

async function getProjects(): Promise<Project[]> {
  const supabase = await createClient()

  // Get current user for like status
  const { data: { user } } = await supabase.auth.getUser()
  let profileId: string | null = null
  if (user) {
    const { data: profileData } = await supabase.from("profiles").select("id").eq("user_id", user.id).single()
    profileId = profileData?.id || null
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
    .order("created_at", { ascending: false })
    .limit(30)

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
      avg_rating: avgRating,
      cover_image_url: [...images].sort((a, b) => a.sort_order - b.sort_order)[0]?.url || p.cover_image_url,
    } as Project
  })
}

export async function ProjectFeed() {
  const projects = await getProjects()

  if (projects.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-zinc-100">
        <div className="h-20 w-20 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">🏛️</span>
        </div>
        <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
        <p className="text-zinc-500 max-w-sm mx-auto mb-6">
          Be the first to share your architecture work with the community. Upload your project and get feedback from professionals.
        </p>
        <a
          href="/upload"
          className="inline-flex items-center justify-center rounded-xl bg-zinc-900 text-white px-6 py-3 text-sm font-medium hover:bg-zinc-800 transition-colors shadow-sm"
        >
          Share Your First Project
        </a>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  )
}
