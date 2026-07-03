import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { ProfileView } from "@/components/profile/profile-view"
import type { Profile, Project, Review } from "@/types/database"

async function getProfile(id: string) {
  const supabase = await createClient()

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !profile) return null

  // Get user's projects
  const { data: projects } = await supabase
    .from("projects")
    .select(`
      *,
      project_images (url, sort_order),
      reviews (overall_rating),
      likes (id, user_id)
    `)
    .eq("user_id", id)
    .order("created_at", { ascending: false })
    .limit(20)

  // Get reviews written by this professional
  let reviewsWritten: Review[] = []
  if (profile.role === "professional") {
    const { data: reviews } = await supabase
      .from("reviews")
      .select(`
        *,
        projects:project_id (id, title, cover_image_url),
        profiles:reviewer_id (full_name)
      `)
      .eq("reviewer_id", id)
      .order("created_at", { ascending: false })
    reviewsWritten = (reviews as Review[]) || []
  }

  const transformedProjects = (projects || []).map((p: Record<string, unknown>) => {
    const likes = (p.likes as Array<{ id: string; user_id: string }>) || []
    const reviews = (p.reviews as Array<{ overall_rating: number }>) || []
    const images = (p.project_images as Array<{ url: string; sort_order: number }>) || []

    const ratings = reviews.map((r) => r.overall_rating).filter((r) => r != null)
    const avgRating = ratings.length > 0
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : null

    return {
      ...p,
      like_count: likes.length,
      review_count: reviews.length,
      liked_by_profile_ids: likes.map((l) => l.user_id),
      avg_rating: avgRating,
      cover_image_url: [...images].sort((a, b) => a.sort_order - b.sort_order)[0]?.url || p.cover_image_url,
    } as Project
  })

  return { profile: profile as Profile, projects: transformedProjects, reviewsWritten }
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await getProfile(id)

  if (!data) notFound()

  return (
    <>
      <Navbar />
      <ProfileView
        profile={data.profile}
        projects={data.projects}
        reviewsWritten={data.reviewsWritten}
      />
    </>
  )
}
