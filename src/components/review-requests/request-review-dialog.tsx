"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import type { Project } from "@/types/database"

interface Props {
  architectId: string
  architectName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RequestReviewDialog({ architectId, architectName, open, onOpenChange }: Props) {
  const { profile } = useAuth()
  const [projects, setProjects] = useState<Pick<Project, "id" | "title" | "cover_image_url">[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && profile) {
      const supabase = createClient()
      supabase.from("projects")
        .select("id, title, cover_image_url")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          if (data) {
            setProjects(data as Pick<Project, "id" | "title" | "cover_image_url">[])
            if (data.length > 0) setSelectedProjectId(data[0].id)
          }
        })
    }
  }, [open, profile])

  const handleSubmit = async () => {
    if (!profile || !selectedProjectId) return
    setLoading(true)
    const supabase = createClient()

    const { error } = await supabase.from("review_requests").insert({
      student_id: profile.id,
      architect_id: architectId,
      project_id: selectedProjectId,
      message: message.trim(),
    })

    if (error) {
      if (error.code === "23505") {
        toast.error("You've already sent a review request to this architect for this project")
      } else {
        toast.error("Failed to send request")
      }
    } else {
      toast.success(`Review request sent to ${architectName}!`)
      setMessage("")
      onOpenChange(false)
    }
    setLoading(false)
  }

  if (!profile) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request Review from {architectName}</DialogTitle>
          <DialogDescription>
            Send a private review request with one of your projects.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          {/* Project selector */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Select Project</label>
            {projects.length === 0 ? (
              <p className="text-sm text-zinc-500">You haven't uploaded any projects yet.</p>
            ) : (
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            )}
          </div>
          {/* Message */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Message (optional)</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Hi ${architectName}, I'd love your feedback on this project...`}
              rows={3}
            />
          </div>
          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={loading || !selectedProjectId || projects.length === 0}
            className="w-full"
          >
            {loading ? "Sending..." : "Send Review Request"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
