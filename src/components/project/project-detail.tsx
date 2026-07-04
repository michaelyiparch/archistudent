"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {
  Heart,
  MessageSquare,
  Star,
  ChevronLeft,
  ChevronRight,
  Send,
  Award,
  Lightbulb,
  PenTool,
  Eye,
  EyeOff,
  Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { CATEGORY_LABELS, STAGE_LABELS } from "@/types/database"
import type { Project, Review, Comment } from "@/types/database"
import { formatDistanceToNow } from "date-fns"
import { InviteArchitectDialog } from "@/components/review-requests/invite-architect-dialog"

export function ProjectDetail({
  project,
  reviews,
  initialComments,
}: {
  project: Project
  reviews: Review[]
  initialComments: Comment[]
}) {
  const { user, profile } = useAuth()
  const router = useRouter()

  const [currentImage, setCurrentImage] = useState(0)
  const [comments, setComments] = useState(initialComments)
  const [newComment, setNewComment] = useState("")
  const [commentLoading, setCommentLoading] = useState(false)
  // Client-side like detection: use profile ID from auth context
  const clientLiked = profile?.id
    ? (project.liked_by_profile_ids || []).includes(profile.id)
    : false
  const [liked, setLiked] = useState(project.user_has_liked || clientLiked)
  const [likeCount, setLikeCount] = useState(project.like_count || 0)
  const [likeLoading, setLikeLoading] = useState(false)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [vis, setVis] = useState(project.visibility || "public")
  const [togglingVis, setTogglingVis] = useState(false)

  const handleToggleVisibility = async () => {
    setTogglingVis(true)
    const newVis = vis === "public" ? "private" : "public"
    const supabase = createClient()
    const { error } = await supabase.from("projects").update({ visibility: newVis }).eq("id", project.id)
    if (error) { toast.error("Failed to update"); setTogglingVis(false); return }
    setVis(newVis)
    toast.success(newVis === "private" ? "Only architects can see this now" : "Everyone can see this now")
    setTogglingVis(false)
  }

  const isAdmin = profile?.is_admin === true
  const isOwner = profile?.id && project.user_id === profile.id
  const canDeleteProject = isAdmin || isOwner

  const images = [...(project.project_images || [])].sort((a, b) => a.sort_order - b.sort_order)
  const authorProfile = project.profiles

  const handleLike = async () => {
    if (!user) {
      toast("Sign in to like", {
        action: { label: "Sign In", onClick: () => router.push("/auth/login") },
      })
      return
    }
    if (likeLoading) return
    setLikeLoading(true)

    const prevLiked = liked
    const prevCount = likeCount

    setLiked(!liked)
    setLikeCount((c) => c + (liked ? -1 : 1))

    const supabase = createClient()
    const { data: profileData, error: profileError } = await supabase.from("profiles").select("id").eq("user_id", user.id).single()
    if (profileError || !profileData) {
      console.error("Profile lookup failed:", profileError)
      setLiked(prevLiked)
      setLikeCount(prevCount)
      setLikeLoading(false)
      toast.error("Could not find your profile")
      return
    }

    if (liked) {
      const { error } = await supabase.from("likes").delete().eq("project_id", project.id).eq("user_id", profileData.id)
      if (error) {
        console.error("Unlike failed:", error)
        setLiked(prevLiked)
        setLikeCount(prevCount)
        toast.error(error.message || "Failed to unlike")
        setLikeLoading(false)
        return
      }
    } else {
      const { error } = await supabase.from("likes").insert({ project_id: project.id, user_id: profileData.id })
      if (error) {
        if (error.code === "23505") {
          console.log("Like already exists, treating as success")
        } else {
          console.error("Like failed:", error)
          setLiked(prevLiked)
          setLikeCount(prevCount)
          toast.error(error.message || "Failed to like")
          setLikeLoading(false)
          return
        }
      }
    }
    setLikeLoading(false)
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || !user || commentLoading) return
    setCommentLoading(true)

    const supabase = createClient()
    const { data: profileData } = await supabase.from("profiles").select("id").eq("user_id", user.id).single()
    if (!profileData) { setCommentLoading(false); return }

    const { data, error } = await supabase
      .from("comments")
      .insert({
        project_id: project.id,
        user_id: profileData.id,
        content: newComment.trim(),
      })
      .select(`*, profiles:user_id (id, full_name, avatar_url, role)`)
      .single()

    if (error) {
      toast.error("Failed to add comment")
    } else if (data) {
      setComments((prev) => [...prev, data as Comment])
      setNewComment("")
    }
    setCommentLoading(false)
  }

  const handleDeleteProject = async () => {
    if (!confirm("Delete this entire project? This cannot be undone.")) return
    const supabase = createClient()
    const { error } = await supabase.from("projects").delete().eq("id", project.id)
    if (error) { toast.error("Failed to delete"); return }
    toast.success("Project deleted")
    router.push("/")
    router.refresh()
  }

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("Delete this review?")) return
    const supabase = createClient()
    const { error } = await supabase.from("reviews").delete().eq("id", reviewId)
    if (error) { toast.error("Failed to delete"); return }
    toast.success("Review deleted")
    router.refresh()
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Delete this comment?")) return
    const supabase = createClient()
    const { error } = await supabase.from("comments").delete().eq("id", commentId)
    if (error) { toast.error("Failed to delete"); return }
    setComments((prev) => prev.filter((c) => c.id !== commentId))
    toast.success("Comment deleted")
    router.refresh()
  }

  const nextImage = () => { if (images.length === 0) return; setCurrentImage((i) => (i + 1) % images.length) }
  const prevImage = () => { if (images.length === 0) return; setCurrentImage((i) => (i - 1 + images.length) % images.length) }

  return (
    <main className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Images + Info + Comments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image Carousel */}
          <div className="relative aspect-[16/10] bg-zinc-100 rounded-xl overflow-hidden group">
            {images.length > 0 ? (
              <>
                <img
                  src={images[currentImage]?.url}
                  alt={images[currentImage]?.caption || project.title}
                  className="h-full w-full object-cover"
                />
                {images.length > 1 && (
                  <>
                    <button onClick={prevImage} className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow">
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button onClick={nextImage} className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow">
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {images.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentImage(idx)}
                          className={cn("h-2 rounded-full transition-all", idx === currentImage ? "w-5 bg-white" : "w-2 bg-white/60")}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-6xl">🏛️</div>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImage(idx)}
                  className={cn("h-16 w-24 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors", idx === currentImage ? "border-zinc-900" : "border-transparent opacity-60 hover:opacity-100")}
                >
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Project Info */}
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">
                  {project.title}
                  {canDeleteProject && (
                    <button onClick={handleDeleteProject} className="ml-2 text-red-400 hover:text-red-600 inline-block" title="Delete project">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}</h1>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge>{CATEGORY_LABELS[project.category]}</Badge>
                  <Badge variant="secondary">{STAGE_LABELS[project.stage]}</Badge>
                  {vis === "private" ? (
                    <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                      <EyeOff className="mr-1 h-3 w-3" /> Architects Only
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                      <Eye className="mr-1 h-3 w-3" /> Everyone
                    </Badge>
                  )}
                  {project.avg_rating && (
                    <Badge variant="outline" className="flex items-center gap-1 border-amber-200 bg-amber-50 text-amber-800">
                      <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                      {project.avg_rating.toFixed(1)} avg rating
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <p className="mt-4 text-zinc-600 leading-relaxed whitespace-pre-wrap">{project.description}</p>
            <p className="mt-2 text-xs text-zinc-400">
              Posted {formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}
            </p>
          </div>

          <Separator />

          {/* Actions bar */}
          <div className="flex items-center gap-3">
            <Button
              variant={liked ? "default" : "outline"}
              size="sm"
              onClick={handleLike}
              disabled={likeLoading}
            >
              <Heart className={cn("mr-1.5 h-4 w-4", liked && "fill-current")} />
              {likeCount}
            </Button>
            {isOwner && profile?.role === "student" && (
              <Button size="sm" variant="outline" onClick={() => setShowInviteDialog(true)}>
                <Send className="mr-1.5 h-4 w-4" /> Invite Architect
              </Button>
            )}
            {isOwner && (
              <Button size="sm" variant="ghost" onClick={handleToggleVisibility} disabled={togglingVis}>
                {vis === "public" ? (
                  <><EyeOff className="mr-1.5 h-4 w-4" /> Architects Only</>
                ) : (
                  <><Eye className="mr-1.5 h-4 w-4" /> Everyone</>
                )}
              </Button>
            )}
          </div>

          <Separator />

          {/* Comments */}
          <div>
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5" /> Comments ({comments.length})
            </h3>

            {user ? (
              <div className="flex gap-3 mb-6">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-xs bg-zinc-900 text-white">
                    {profile?.full_name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 flex gap-2">
                  <Input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1"
                    onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                  />
                  <Button size="icon" variant="outline" onClick={handleAddComment} disabled={!newComment.trim() || commentLoading}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 bg-zinc-50 rounded-xl mb-6">
                <p className="text-sm text-zinc-500">
                  <button onClick={() => router.push("/auth/login")} className="underline hover:text-zinc-900 font-medium">
                    Sign in
                  </button>{" "}
                  to leave a comment
                </p>
              </div>
            )}

            <div className="space-y-4 max-h-80 overflow-y-auto">
              {comments.length === 0 ? (
                <p className="text-sm text-zinc-400 text-center py-6">No comments yet. Be the first!</p>
              ) : (
                comments.map((comment) => {
                  const cp = (comment as Comment & { profiles?: { full_name: string; avatar_url: string | null; role: string } }).profiles
                  return (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar className="h-7 w-7 flex-shrink-0">
                        <AvatarImage src={cp?.avatar_url || undefined} />
                        <AvatarFallback className="text-[10px] bg-zinc-200 text-zinc-600">
                          {cp?.full_name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{cp?.full_name}</span>
                          <span className="text-xs text-zinc-400">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-700 mt-0.5">
                          {comment.content}
                          {(isAdmin || comment.user_id === profile?.id) && (
                            <button onClick={() => handleDeleteComment(comment.id)} className="ml-2 text-red-400 hover:text-red-600 inline align-middle" title="Delete comment">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Right: Author + Professional Reviews */}
        <div className="space-y-6">
          {/* Author */}
          <div className="bg-zinc-50 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={authorProfile?.avatar_url || undefined} />
                <AvatarFallback className="bg-zinc-200 text-zinc-600">
                  {authorProfile?.full_name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">{authorProfile?.full_name}</p>
                <p className="text-xs text-zinc-500">{authorProfile?.university_or_firm || authorProfile?.role}</p>
              </div>
            </div>
            {authorProfile?.id ? (
              <Button variant="outline" size="sm" className="w-full" onClick={() => router.push(`/profile/${authorProfile.id}`)}>
                View Profile
              </Button>
            ) : null}
          </div>

          {/* Professional Reviews Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Award className="h-5 w-5 text-amber-600" />
              <h3 className="font-semibold text-lg">
                Professional Reviews{" "}
                <span className="text-zinc-400 font-normal">({reviews.length})</span>
              </h3>
              {user && profile?.role === "professional" && (
                <Button size="sm" className="ml-auto" onClick={() => router.push(`/review/${project.id}`)}>
                  <Award className="mr-1.5 h-4 w-4" /> Write Review
                </Button>
              )}
            </div>

            {reviews.length === 0 ? (
              <div className="text-center py-8 bg-zinc-50 rounded-xl">
                <div className="h-10 w-10 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Award className="h-5 w-5 text-amber-600" />
                </div>
                <p className="text-sm text-zinc-500 mb-3">Awaiting professional review</p>
                {profile?.role === "professional" && (
                  <Button size="sm" onClick={() => router.push(`/review/${project.id}`)}>
                    Be the first to review
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-zinc-50 rounded-xl p-5 border border-zinc-100">
                    {/* Reviewer */}
                    <div className="flex items-center gap-2 mb-4">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={review.profiles?.avatar_url || undefined} />
                        <AvatarFallback className="text-[10px] bg-zinc-900 text-white">
                          {review.profiles?.full_name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium inline-flex items-center gap-1">
                          {review.profiles?.full_name}
                          {review.profiles?.verified_professional && (
                            <span className="text-blue-500" title="Verified Professional">
                              <Award className="h-3.5 w-3.5" />
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-zinc-500">{review.profiles?.university_or_firm || "Architect"}</p>
                      </div>
                      <div className="ml-auto flex items-center gap-2">
                      {(isAdmin || review.reviewer_id === profile?.id) && (
                        <button onClick={() => handleDeleteReview(review.id)} className="text-red-400 hover:text-red-600" title="Delete review">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                        <span className="font-semibold text-sm">{review.overall_rating}/5</span>
                      </div>
                    </div>
                    </div>

                    {/* Rubric grid */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {[
                        { icon: Lightbulb, label: "Concept", value: review.concept_rating, color: "text-amber-600 bg-amber-50" },
                        { icon: PenTool, label: "Execution", value: review.execution_rating, color: "text-blue-600 bg-blue-50" },
                        { icon: Eye, label: "Presentation", value: review.presentation_rating, color: "text-emerald-600 bg-emerald-50" },
                        { icon: Award, label: "Overall", value: review.overall_rating, color: "text-violet-600 bg-violet-50" },
                      ].map((dim) => (
                        <div key={dim.label} className={`flex items-center justify-between rounded-lg px-3 py-2 ${dim.color}`}>
                          <span className="text-xs font-medium flex items-center gap-1.5">
                            <dim.icon className="h-3.5 w-3.5" /> {dim.label}
                          </span>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <Star
                                key={n}
                                className={cn(
                                  "h-2.5 w-2.5",
                                  n <= dim.value ? "fill-current text-current" : "text-zinc-300"
                                )}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Review comment */}
                    <p className="text-sm text-zinc-700 leading-relaxed">{review.comment}</p>

                    {/* Attached files */}
                    {review.review_files && review.review_files.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {review.review_files.map((file) => (
                          <a
                            key={file.id}
                            href={file.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs bg-zinc-100 hover:bg-zinc-200 rounded-lg px-3 py-1.5 transition-colors"
                          >
                            {file.file_type === "application/pdf" ? (
                              <span className="text-red-500 font-medium">PDF</span>
                            ) : (
                              <img src={file.file_url} alt="" className="h-10 w-14 object-cover rounded" />
                            )}
                            <span className="text-zinc-600 max-w-[120px] truncate">{file.file_name}</span>
                          </a>
                        ))}
                      </div>
                    )}

                    <p className="text-xs text-zinc-400 mt-2">
                      {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <InviteArchitectDialog
        projectId={project.id}
        projectTitle={project.title}
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
      />
    </main>
  )
}
