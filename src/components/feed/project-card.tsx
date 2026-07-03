"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Heart, MessageSquare, Star, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useState, useOptimistic, startTransition } from "react"
import { CATEGORY_LABELS, STAGE_LABELS } from "@/types/database"
import type { Project } from "@/types/database"
import { cn } from "@/lib/utils"

export function ProjectCard({ project }: { project: Project }) {
  const { user, profile: currentProfile } = useAuth()
  const router = useRouter()
  const isAdmin = currentProfile?.is_admin === true
  const isOwner = currentProfile?.id && project.user_id === currentProfile.id
  const canDelete = isAdmin || isOwner

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm("Delete this project?")) return
    const supabase = createClient()
    const { error } = await supabase.from("projects").delete().eq("id", project.id)
    if (error) { toast.error("Failed to delete"); return }
    toast.success("Project deleted")
    router.refresh()
  }
  // Client-side like detection: use profile ID from auth context to check
  // This works even when the server couldn't determine the user's session
  const clientLiked = currentProfile?.id
    ? (project.liked_by_profile_ids || []).includes(currentProfile.id)
    : false
  const effectiveLiked = project.user_has_liked || clientLiked

  const [liked, setLiked] = useOptimistic(
    effectiveLiked,
    (_, next: boolean) => next
  )
  const [likeCount, setLikeCount] = useState(project.like_count || 0)
  const [pending, setPending] = useState(false)

  const profile = project.profiles
  const authorInitials = profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?"

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user) {
      toast("Sign in to like projects", {
        action: { label: "Sign In", onClick: () => router.push("/auth/login") },
      })
      return
    }

    if (pending) return
    setPending(true)

    const prevLiked = liked
    const prevCount = likeCount

    startTransition(() => {
      setLiked(!liked)
      setLikeCount((c) => c + (liked ? -1 : 1))
    })

    const supabase = createClient()
    const { data: profileData, error: profileError } = await supabase.from("profiles").select("id").eq("user_id", user.id).single()

    if (profileError || !profileData) {
      console.error("Profile lookup failed:", profileError)
      setLikeCount(prevCount)
      setPending(false)
      toast.error("Could not find your profile")
      return
    }

    if (liked) {
      const { error } = await supabase.from("likes").delete().eq("project_id", project.id).eq("user_id", profileData.id)
      if (error) {
        console.error("Unlike failed:", error)
        setLikeCount(prevCount)
        toast.error(error.message || "Failed to unlike")
        setPending(false)
        return
      }
    } else {
      const { error } = await supabase.from("likes").insert({ project_id: project.id, user_id: profileData.id })
      if (error) {
        // Duplicate key means the like already exists — that's fine, treat as success
        if (error.code === "23505") {
          console.log("Like already exists, treating as success")
        } else {
          console.error("Like failed:", error)
          setLikeCount(prevCount)
          toast.error(error.message || "Failed to like")
          setPending(false)
          return
        }
      }
    }

    setPending(false)
  }

  return (
    <Card className="group overflow-hidden border-zinc-200 hover:border-zinc-300 hover:shadow-md transition-all">
      <Link href={`/project/${project.id}`}>
        {/* Cover Image */}
        <div className="aspect-[4/3] bg-zinc-100 relative overflow-hidden">
          {project.cover_image_url ? (
            <img
              src={project.cover_image_url}
              alt={project.title}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <span className="text-4xl text-zinc-300">🏛️</span>
            </div>
          )}

          {/* Rating badge */}
          {project.avg_rating != null && project.avg_rating > 0 && (
            <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur px-2 py-1 rounded-full text-xs font-medium">
              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
              {project.avg_rating.toFixed(1)}
            </div>
          )}

          {/* Delete button — top right, below rating if present */}
          {canDelete && (
            <button onClick={handleDelete} className={`absolute right-3 z-20 h-8 w-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg ${project.avg_rating != null && project.avg_rating > 0 ? "top-11" : "top-3"}`} title="Delete project">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          {/* Category badge */}
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className="bg-white/90 backdrop-blur text-xs">
              {CATEGORY_LABELS[project.category]}
            </Badge>
          </div>
        </div>

        <CardContent className="p-4">
          {/* Author */}
          <div className="flex items-center gap-2 mb-3">
            <Avatar className="h-6 w-6">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="text-[10px]">{authorInitials}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-zinc-600 truncate">
              {profile?.full_name || "Unknown"}
              {profile?.verified_professional && (
                <span className="ml-1 text-blue-500" title="Verified Professional">✓</span>
              )}
            </span>
            <span className="text-xs text-zinc-400 ml-auto">
              {STAGE_LABELS[project.stage]}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-semibold text-zinc-900 mb-1 line-clamp-1 group-hover:text-zinc-600 transition-colors">
            {project.title}
          </h3>
          <p className="text-sm text-zinc-500 line-clamp-2 mb-4">{project.description}</p>

          {/* Actions */}
          <div className="flex items-center gap-4 text-sm text-zinc-500">
            <button
              onClick={handleLike}
              disabled={pending}
              className={cn(
                "flex items-center gap-1 hover:text-red-500 transition-colors disabled:opacity-50",
                liked && "text-red-500"
              )}
            >
              <Heart className={cn("h-4 w-4", liked && "fill-current")} />
              <span>{likeCount}</span>
            </button>
            <div className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <span>{project.review_count || 0} reviews</span>
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  )
}
