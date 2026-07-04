import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { ProjectDetail } from "@/components/project/project-detail"
import type { Project, Review, Comment } from "@/types/database"

async function getProject(id: string): Promise<{
  project: Project
  reviews: Review[]
  comments: Comment[]
} | null> {
  const supabase = await createClient()

  const { data: project, error } = await supabase
    .from("projects")
    .select(`
      *,
      profiles:user_id (id, full_name, avatar_url, university_or_firm, role, verified_professional),
      project_images (id, url, caption, sort_order)
    `)
    .eq("id", id)
    .single()

  if (error || !project) return null

  const { data: likes } = await supabase
    .from("likes")
    .select("*")
    .eq("project_id", id)

  // Get reviews with reviewer profiles and attached files
  const { data: reviews } = await supabase
    .from("reviews")
    .select(`
      *,
      profiles:reviewer_id (id, full_name, avatar_url, university_or_firm, verified_professional),
      review_files (id, file_url, file_name, file_type, file_size)
    `)
    .eq("project_id", id)
    .order("created_at", { ascending: false })

  // Get comments with user profiles
  const { data: comments } = await supabase
    .from("comments")
    .select(`
      *,
      profiles:user_id (id, full_name, avatar_url, role)
    `)
    .eq("project_id", id)
    .order("created_at", { ascending: true })

  const likeList = (likes as Array<{ id: string; user_id: string }>) || []
  const reviewList = (reviews as Review[]) || []
  const commentList = (comments as Comment[]) || []
  const images = project.project_images || []
  const profile = project.profiles

  const ratings = reviewList.map((r) => r.overall_rating).filter((r) => r != null)
  const avgRating = ratings.length > 0
    ? ratings.reduce((a, b) => a + b, 0) / ratings.length
    : null

  // Get current user for like status
  const { data: { user } } = await supabase.auth.getUser()
  let currentProfileId: string | null = null
  if (user) {
    const { data: pd } = await supabase.from("profiles").select("id").eq("user_id", user.id).single()
    currentProfileId = pd?.id || null
  }

  const transformedProject: Project = {
    ...project,
    like_count: likeList.length,
    review_count: reviewList.length,
    user_has_liked: currentProfileId ? likeList.some((l) => l.user_id === currentProfileId) : false,
    liked_by_profile_ids: likeList.map((l) => l.user_id),
    avg_rating: avgRating,
    cover_image_url: [...images].sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)[0]?.url || project.cover_image_url,
    profiles: profile,
  }

  return { project: transformedProject, reviews: reviewList, comments: commentList }
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await getProject(id)

  if (!data) notFound()

  return (
    <>
      <Navbar />
      <ProjectDetail
        project={data.project}
        reviews={data.reviews}
        initialComments={data.comments}
      />
    </>
  )
}
