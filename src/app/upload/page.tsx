"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"
import { Navbar } from "@/components/layout/navbar"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { UploadCloud, X, ArrowLeft, ArrowRight, Check, ImagePlus } from "lucide-react"
import { CATEGORY_LABELS, STAGE_LABELS } from "@/types/database"
import type { ProjectCategory, ProjectStage } from "@/types/database"
import Link from "next/link"

const ACCEPTED_IMAGES = "image/jpeg,image/png,image/webp,image/heic"
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

interface UploadImage {
  file: File
  preview: string
  uploading: boolean
  url?: string
}

export default function UploadPage() {
  const { profile, loading: authLoading } = useAuth()
  const router = useRouter()

  const [step, setStep] = useState(1)
  const [images, setImages] = useState<UploadImage[]>([])
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState<ProjectCategory>("other")
  const [stage, setStage] = useState<ProjectStage>("concept")
  const [submitting, setSubmitting] = useState(false)

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const newImages: UploadImage[] = files
      .filter((f) => f.size <= MAX_FILE_SIZE)
      .map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        uploading: false,
      }))

    if (newImages.length < files.length) {
      toast.warning("Some files were too large (>10MB) and were skipped")
    }

    setImages((prev) => [...prev, ...newImages].slice(0, 10)) // Max 10 images
  }, [])

  const removeImage = (index: number) => {
    setImages((prev) => {
      const next = [...prev]
      URL.revokeObjectURL(next[index].preview)
      next.splice(index, 1)
      return next
    })
  }

  const uploadImages = async (): Promise<string[]> => {
    const supabase = createClient()
    const urls: string[] = []

    for (let i = 0; i < images.length; i++) {
      setImages((prev) => prev.map((img, idx) => idx === i ? { ...img, uploading: true } : img))

      const ext = images[i].file.name.split(".").pop() || "jpg"
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const path = `${profile!.id}/${filename}`

      const { data, error } = await supabase.storage
        .from("project-images")
        .upload(path, images[i].file, { upsert: false })

      if (error) {
        toast.error(`Failed to upload image: ${error.message}`)
        throw error
      }

      const { data: urlData } = supabase.storage.from("project-images").getPublicUrl(data.path)
      urls.push(urlData.publicUrl)
    }

    return urls
  }

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Please enter a project title")
      return
    }
    if (images.length === 0) {
      toast.error("Please upload at least one image")
      return
    }

    setSubmitting(true)

    try {
      const imageUrls = await uploadImages()

      const supabase = createClient()
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", profile!.user_id)
        .single()

      if (!profileData) throw new Error("Profile not found")

      const { data: project, error } = await supabase
        .from("projects")
        .insert({
          user_id: profileData.id,
          title: title.trim(),
          description: description.trim(),
          category,
          stage,
          cover_image_url: imageUrls[0],
        })
        .select("id")
        .single()

      if (error) throw error
      if (!project) throw new Error("Failed to create project")

      // Insert project images
      const imageRows = imageUrls.map((url, idx) => ({
        project_id: project.id,
        url,
        caption: null,
        sort_order: idx,
      }))

      await supabase.from("project_images").insert(imageRows)

      toast.success("Project published!")
      router.push(`/project/${project.id}`)
    } catch (err: unknown) {
      let message = "Something went wrong"
      if (err instanceof Error) {
        message = err.message
      } else if (err && typeof err === "object" && "message" in err) {
        message = String((err as { message: unknown }).message)
      }
      toast.error(message)
      console.error("Upload error:", err)
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading) {
    return (
      <>
        <Navbar />
        <main className="container mx-auto px-4 py-16 max-w-3xl text-center">
          <div className="h-6 w-32 bg-zinc-200 rounded animate-pulse mx-auto" />
        </main>
      </>
    )
  }

  if (!profile) {
    return (
      <>
        <Navbar />
        <main className="container mx-auto px-4 py-16 max-w-3xl text-center space-y-4">
          <h1 className="text-2xl font-bold">Sign In Required</h1>
          <p className="text-zinc-500">You need an account to upload projects.</p>
          <Link href="/auth/login?redirect=/upload" className={buttonVariants({ size: "sm" })}>
            Sign In
          </Link>
        </main>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Link href="/" className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-900 mb-6">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-bold">Share Your Project</h1>
          <p className="text-zinc-500 mt-1">Upload images and describe your work</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  s <= step ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-400"
                }`}
              >
                {s < step ? <Check className="h-4 w-4" /> : s}
              </div>
              <span className="text-sm text-zinc-500 hidden sm:inline">
                {s === 1 ? "Images" : s === 2 ? "Details" : "Review"}
              </span>
              {s < 3 && <div className="w-8 sm:w-16 h-px bg-zinc-200" />}
            </div>
          ))}
        </div>

        {/* Step 1: Upload Images */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Upload Images</CardTitle>
              <CardDescription>Add up to 10 images of your project. First image will be the cover.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                {images.map((img, idx) => (
                  <div key={idx} className="relative aspect-[4/3] rounded-lg overflow-hidden bg-zinc-100 group">
                    <img src={img.preview} alt="" className="h-full w-full object-cover" />
                    {img.uploading && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                    <button
                      onClick={() => removeImage(idx)}
                      className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    {idx === 0 && (
                      <Badge className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px]">Cover</Badge>
                    )}
                  </div>
                ))}
                {images.length < 10 && (
                  <label className="aspect-[4/3] rounded-lg border-2 border-dashed border-zinc-300 hover:border-zinc-400 flex flex-col items-center justify-center cursor-pointer transition-colors gap-2">
                    <ImagePlus className="h-8 w-8 text-zinc-400" />
                    <span className="text-xs text-zinc-500">Add Image</span>
                    <input
                      type="file"
                      accept={ACCEPTED_IMAGES}
                      onChange={handleImageSelect}
                      className="hidden"
                      multiple
                    />
                  </label>
                )}
              </div>
              <Button onClick={() => setStep(2)} disabled={images.length === 0} className="w-full sm:w-auto">
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Details */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
              <CardDescription>Tell us about your project</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Riverside Cultural Center" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your concept, materials, site context, program..." rows={5} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v as ProjectCategory)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Stage</Label>
                  <Select value={stage} onValueChange={(v) => setStage(v as ProjectStage)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STAGE_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button onClick={() => setStep(3)}>
                  Review <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Review & Publish */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Review &amp; Publish</CardTitle>
              <CardDescription>Check everything looks good before publishing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-[4/3] rounded-lg overflow-hidden bg-zinc-100">
                {images[0] && (
                  <img src={images[0].preview} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold">{title || "Untitled"}</h2>
                <div className="flex gap-2 mt-2">
                  <Badge>{CATEGORY_LABELS[category]}</Badge>
                  <Badge variant="secondary">{STAGE_LABELS[stage]}</Badge>
                </div>
              </div>
              <p className="text-zinc-600">{description || "No description provided."}</p>
              <p className="text-sm text-zinc-400">{images.length} image{images.length !== 1 ? "s" : ""} attached</p>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting ? (
                    <>Publishing...</>
                  ) : (
                    <><UploadCloud className="mr-2 h-4 w-4" /> Publish Project</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </>
  )
}
