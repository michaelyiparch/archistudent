"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { ProjectCard } from "@/components/feed/project-card"
import { Skeleton } from "@/components/ui/skeleton"
import type { Project } from "@/types/database"

export function ProjectFeedTabs({
  publicProjects,
  isProfessional,
}: {
  publicProjects: Project[]
  isProfessional: boolean
}) {
  const [tab, setTab] = useState<"public" | "private">("public")
  const [privateProjects, setPrivateProjects] = useState<Project[]>([])
  const [loadingPrivate, setLoadingPrivate] = useState(false)

  useEffect(() => {
    if (tab === "private" && privateProjects.length === 0 && isProfessional) {
      setLoadingPrivate(true)
      const supabase = createClient()
      supabase
        .from("projects")
        .select(`
          *,
          profiles:user_id (id, full_name, avatar_url, university_or_firm, role, verified_professional),
          project_images (id, url, caption, sort_order),
          reviews (id, overall_rating),
          likes (id, user_id)
        `)
        .eq("visibility", "private")
        .order("created_at", { ascending: false })
        .limit(30)
        .then(({ data }) => {
          if (data) {
            setPrivateProjects(data.map((p: Record<string, unknown>) => {
              const likes = (p.likes as Array<{ id: string; user_id: string }>) || []
              const reviews = (p.reviews as Array<{ id: string; overall_rating: number }>) || []
              const images = (p.project_images as Array<{ id: string; url: string; sort_order?: number }>) || []
              const ratings = reviews.map((r) => r.overall_rating).filter((r) => r != null)
              return {
                ...p,
                like_count: likes.length,
                review_count: reviews.length,
                avg_rating: ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null,
                cover_image_url: [...images].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0]?.url || p.cover_image_url,
              } as Project
            }))
          }
          setLoadingPrivate(false)
        })
    }
  }, [tab, privateProjects.length, isProfessional])

  const projects = tab === "public" ? publicProjects : privateProjects
  const empty = projects.length === 0

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-zinc-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab("public")}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            tab === "public" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700"
          }`}
        >
          Discover
        </button>
        {isProfessional && (
          <button
            onClick={() => setTab("private")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === "private" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            Review Requests
          </button>
        )}
      </div>

      {/* Content */}
      {loadingPrivate ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3 bg-white rounded-xl p-3 border border-zinc-100">
              <Skeleton className="aspect-[4/3] w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : empty ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-zinc-100">
          <div className="h-20 w-20 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">{tab === "public" ? "🏛️" : "🔒"}</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">
            {tab === "public" ? "No projects yet" : "No review requests"}
          </h3>
          <p className="text-zinc-500 max-w-sm mx-auto">
            {tab === "public"
              ? "Be the first to share your architecture work with the community."
              : "When students submit work for architect review, it'll appear here."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  )
}
