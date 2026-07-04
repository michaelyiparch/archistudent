"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import type { Profile } from "@/types/database"

interface Props {
  projectId: string
  projectTitle: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InviteArchitectDialog({ projectId, projectTitle, open, onOpenChange }: Props) {
  const [architects, setArchitects] = useState<Pick<Profile, "id" | "full_name" | "university_or_firm">[]>([])
  const [selectedId, setSelectedId] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      const supabase = createClient()
      supabase.from("profiles")
        .select("id, full_name, university_or_firm")
        .eq("role", "professional")
        .eq("verified_professional", true)
        .order("full_name")
        .then(({ data }) => {
          if (data) {
            setArchitects(data as typeof architects)
            if (data.length > 0) setSelectedId(data[0].id)
          }
        })
    }
  }, [open])

  const handleSend = async () => {
    if (!selectedId) return
    setLoading(true)
    const supabase = createClient()

    const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", (await supabase.auth.getUser()).data.user?.id).single()
    if (!profile) { toast.error("Profile not found"); setLoading(false); return }

    const { error } = await supabase.from("review_requests").insert({
      student_id: profile.id,
      architect_id: selectedId,
      project_id: projectId,
      message: message.trim(),
    })

    if (error) {
      if (error.code === "23505") toast.error("Already sent a request for this project")
      else toast.error("Failed to send")
    } else {
      const arch = architects.find(a => a.id === selectedId)
      toast.success(`Invitation sent to ${arch?.full_name || "architect"}!`)
      setMessage("")
      onOpenChange(false)
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite an Architect</DialogTitle>
          <DialogDescription>
            Send a private review invitation for <strong>{projectTitle}</strong>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Select Architect</label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm bg-white"
            >
              {architects.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.full_name}{a.university_or_firm ? ` — ${a.university_or_firm}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Message (optional)</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hey, I'd love your feedback on this project..."
              rows={3}
            />
          </div>
          <Button onClick={handleSend} disabled={loading || !selectedId} className="w-full">
            {loading ? "Sending..." : "Send Invitation"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
