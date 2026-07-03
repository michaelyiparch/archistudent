import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/layout/navbar"
import { ProjectCard } from "@/components/feed/project-card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import type { Project, Profile } from "@/types/database"

async function searchContent(query: string) {
  const supabase = await createClient()

  // Get current user for like status
  const { data: { user } } = await supabase.auth.getUser()
  let profileId: string | null = null
  if (user) {
    const { data: profileData } = await supabase.from("profiles").select("id").eq("user_id", user.id).single()
    profileId = profileData?.id || null
  }

  // Search projects by title and description
  const { data: projects, error } = await supabase
    .from("projects")
    .select(`
      *,
      profiles:user_id (id, full_name, avatar_url, university_or_firm, role, verified_professional),
      project_images (url, sort_order),
      reviews (overall_rating),
      likes (id, user_id)
    `)
    .ilike("title", `%${query}%`)
    .order("created_at", { ascending: false })
    .limit(30)

  // Also search by description if not enough results
  const titleResults = (projects || []).map(p => p.id)
  let descResults: typeof projects = []
  if ((projects || []).length < 30) {
    const { data: desc } = await supabase
      .from("projects")
      .select(`
        *,
        profiles:user_id (id, full_name, avatar_url, university_or_firm, role, verified_professional),
        project_images (url, sort_order),
        reviews (overall_rating),
        likes (id, user_id)
      `)
      .ilike("description", `%${query}%`)
      .order("created_at", { ascending: false })
      .limit(30)

    // Merge, deduplicating by id
    descResults = (desc || []).filter(p => !titleResults.includes(p.id))
  }

  const allProjects = [...(projects || []), ...(descResults || [])].slice(0, 30)

  // Search profiles
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .or(`full_name.ilike.%${query}%,university_or_firm.ilike.%${query}%`)
    .limit(20)

  const transformedProjects = (allProjects || []).map((p: Record<string, unknown>) => {
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
      user_has_liked: profileId ? likes.some((l) => l.user_id === profileId) : false,
      liked_by_profile_ids: likes.map((l) => l.user_id),
      avg_rating: avgRating,
      cover_image_url: [...images].sort((a, b) => a.sort_order - b.sort_order)[0]?.url || p.cover_image_url,
    } as Project
  })

  return { projects: transformedProjects, profiles: (profiles as Profile[]) || [] }
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const query = q?.trim() || ""

  const results = query ? await searchContent(query) : { projects: [], profiles: [] }

  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">
            {query ? `Results for "${query}"` : "Search"}
          </h1>
          <p className="text-zinc-500 mt-1">
            {query
              ? `Found ${results.projects.length} projects and ${results.profiles.length} people`
              : "Search for projects, architects, and students"}
          </p>
        </div>

        {!query ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-zinc-500">Enter a search term to find projects and architects</p>
          </div>
        ) : (
          <Tabs defaultValue="projects">
            <TabsList>
              <TabsTrigger value="projects">
                Projects ({results.projects.length})
              </TabsTrigger>
              <TabsTrigger value="people">
                People ({results.profiles.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="projects" className="mt-6">
              {results.projects.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-zinc-500">No projects found for &quot;{query}&quot;</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {results.projects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="people" className="mt-6">
              {results.profiles.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-zinc-500">No people found for &quot;{query}&quot;</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {results.profiles.map((profile) => {
                    const initials = profile.full_name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2) || "?"

                    return (
                      <Link
                        key={profile.id}
                        href={`/profile/${profile.id}`}
                        className="flex items-center gap-4 bg-zinc-50 rounded-lg p-4 hover:bg-zinc-100 transition-colors"
                      >
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={profile.avatar_url || undefined} />
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{profile.full_name}</p>
                            <Badge variant="secondary" className="capitalize text-xs">
                              {profile.role}
                            </Badge>
                            {profile.verified_professional && (
                              <Badge variant="outline" className="text-blue-600 text-xs">✓ Verified</Badge>
                            )}
                          </div>
                          <p className="text-sm text-zinc-500 mt-0.5">
                            {profile.university_or_firm || profile.role}
                          </p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </>
  )
}
