"use client"

import { Suspense, useState, useEffect } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"
import { Navbar } from "@/components/layout/navbar"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { ArrowLeft, Star, Lightbulb, PenTool, Eye, Award, Upload, Paperclip, X, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import type { Project } from "@/types/database"

const RUBRIC_DIMENSIONS = [
  { key: "concept_rating", label: "Concept", icon: Lightbulb, description: "Originality, clarity of idea, design intent" },
  { key: "execution_rating", label: "Execution", icon: PenTool, description: "Technical skill, detailing, constructability" },
  { key: "presentation_rating", label: "Presentation", icon: Eye, description: "Visual communication, drawing quality, graphics" },
  { key: "overall_rating", label: "Overall", icon: Award, description: "Overall impression and professional quality" },
] as const

interface RatingState {
  concept_rating: number
  execution_rating: number
  presentation_rating: number
  overall_rating: number
}

function ReviewForm() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const projectId = params?.projectId as string
  const requestId = searchParams.get("request_id")

  const [project, setProject] = useState<Project | null>(null)
  const [ratings, setRatings] = useState<RatingState>({
    concept_rating: 0,
    execution_rating: 0,
    presentation_rating: 0,
    overall_rating: 0,
  })
  const [hoveredRating, setHoveredRating] = useState<Record<string, number>>({})
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [files, setFiles] = useState<File[]>([])
  const [uploadingFiles, setUploadingFiles] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase.from("projects").select(`
        *,
        profiles:user_id (full_name, avatar_url, university_or_firm),
        project_images (url, sort_order)
      `).eq("id", projectId).single()
      if (data) setProject(data as Project)
      setLoading(false)
    }
    load()
  }, [projectId])

  useEffect(() => {
    if (!authLoading && !profile) {
      router.push(`/auth/login?redirect=/review/${projectId}`)
    }
  }, [authLoading, profile, projectId, router])

  useEffect(() => {
    if (!authLoading && profile && profile.role !== "professional") {
      toast.error("Only professional architects can submit reviews")
      router.push(`/project/${projectId}`)
    }
  }, [authLoading, profile, projectId, router])

  const handleAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
    const valid = selected.filter(f => {
      const ok = f.type === "application/pdf" || f.type === "image/png"
      if (!ok) toast.error(`${f.name} — only PDF and PNG allowed`)
      if (f.size > 10 * 1024 * 1024) { toast.error(`${f.name} exceeds 10MB`); return false }
      return ok
    })
    setFiles(prev => [...prev, ...valid].slice(0, 5))
  }

  const removeFile = (idx: number) => setFiles(prev => prev.filter((_, i) => i !== idx))

  const handleSubmit = async () => {
    const allRated = Object.values(ratings).every((r) => r > 0)
    if (!allRated) {
      toast.error("Please rate all four dimensions")
      return
    }
    if (!comment.trim()) {
      toast.error("Please write a review comment")
      return
    }

    setSubmitting(true)

    const supabase = createClient()
    const { data: profileData } = await supabase.from("profiles").select("id, user_id").eq("user_id", user!.id).single()

    if (!profileData) {
      toast.error("Profile not found")
      setSubmitting(false)
      return
    }

    // Insert review
    const { data: review, error } = await supabase.from("reviews").insert({
      project_id: projectId,
      reviewer_id: profileData.id,
      ...ratings,
      comment: comment.trim(),
    }).select("id").single()

    if (error) {
      if (error.code === "23505") {
        toast.error("You have already reviewed this project")
      } else {
        toast.error(error.message)
      }
      setSubmitting(false)
      return
    }

    // Upload files
    if (files.length > 0 && review) {
      setUploadingFiles(true)
      for (const file of files) {
        const ext = file.name.split(".").pop() || "pdf"
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const path = `${profileData.id}/${filename}`
        const { data: uploadData, error: uploadErr } = await supabase.storage.from("review-files").upload(path, file)
        if (uploadErr) {
          toast.error(`Failed to upload ${file.name}`)
          continue
        }
        const { data: urlData } = supabase.storage.from("review-files").getPublicUrl(uploadData.path)
        await supabase.from("review_files").insert({
          review_id: review.id,
          file_url: urlData.publicUrl,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
        })
      }
      setUploadingFiles(false)
    }

    // Mark request as completed if coming from a review request
    if (requestId) {
      await supabase.from("review_requests").update({ status: "completed" }).eq("id", requestId)
    }

    toast.success("Review submitted!")
    router.push(`/project/${projectId}`)
  }

  if (authLoading || loading || !profile) return null
  if (profile.role !== "professional") return null

  const coverUrl = project?.project_images?.[0]?.url || project?.cover_image_url

  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {requestId && (
          <div className="bg-amber-50 text-amber-800 text-sm p-3 rounded-lg mb-6 border border-amber-200">
            You are responding to a private review request. Your review will mark it as completed.
          </div>
        )}
        <Link href={`/project/${projectId}`} className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-900 mb-6">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to project
        </Link>

        <h1 className="text-2xl font-bold mb-8">Professional Review</h1>

        {/* Project preview */}
        {project && (
          <div className="flex gap-4 items-center bg-zinc-50 rounded-lg p-4 mb-8">
            <div className="h-16 w-24 rounded-lg overflow-hidden bg-zinc-200 flex-shrink-0">
              {coverUrl ? (
                <img src={coverUrl} alt={`${project.title} cover`} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-2xl">🏛️</div>
              )}
            </div>
            <div>
              <p className="font-medium">{project.title}</p>
              <p className="text-sm text-zinc-500">by {project.profiles?.full_name}</p>
            </div>
          </div>
        )}

        {/* Rubric ratings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Evaluation Rubric</CardTitle>
            <CardDescription>Rate each dimension from 1 (poor) to 5 (excellent)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {RUBRIC_DIMENSIONS.map(({ key, label, icon: Icon, description }) => (
              <div key={key} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-zinc-500" />
                  <Label className="font-medium">{label}</Label>
                  <span className="text-xs text-zinc-400">{description}</span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatings((prev) => ({ ...prev, [key]: star }))}
                      onMouseEnter={() => setHoveredRating((prev) => ({ ...prev, [key]: star }))}
                      onMouseLeave={() => setHoveredRating((prev) => ({ ...prev, [key]: 0 }))}
                      className="focus:outline-none"
                    >
                      <Star
                        className={cn(
                          "h-7 w-7 transition-colors",
                          star <= (hoveredRating[key] || ratings[key as keyof RatingState])
                            ? "fill-yellow-500 text-yellow-500"
                            : "text-zinc-200"
                        )}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-zinc-500">
                    {ratings[key as keyof RatingState] > 0 ? `${ratings[key as keyof RatingState]}/5` : "Select"}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Written critique */}
        <Card>
          <CardHeader>
            <CardTitle>Written Critique</CardTitle>
            <CardDescription>Provide substantive feedback that will help the student improve</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Discuss the project's strengths, areas for improvement, and specific suggestions..."
              rows={8}
            />

            {/* File attachments */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Paperclip className="h-4 w-4" /> Attachments (PDF/PNG, max 5)
              </Label>
              <input
                type="file"
                accept=".pdf,.png,image/png,application/pdf"
                multiple
                onChange={handleAddFiles}
                className="block w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200"
              />
              {files.length > 0 && (
                <div className="space-y-1.5 mt-2">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm bg-zinc-50 rounded-lg px-3 py-2">
                      <FileText className="h-4 w-4 text-zinc-400" />
                      <span className="flex-1 truncate">{f.name}</span>
                      <span className="text-xs text-zinc-400">{(f.size / 1024 / 1024).toFixed(1)}MB</span>
                      <button onClick={() => removeFile(i)} className="text-zinc-400 hover:text-red-500">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button onClick={handleSubmit} disabled={submitting || uploadingFiles} className="w-full">
              {submitting ? (
                uploadingFiles ? "Uploading files..." : "Submitting..."
              ) : (
                <><Upload className="mr-2 h-4 w-4" /> Submit Review</>
              )}
            </Button>
          </CardContent>
        </Card>
      </main>
    </>
  )
}

export default function ReviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" />
      </div>
    }>
      <ReviewForm />
    </Suspense>
  )
}
