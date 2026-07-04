"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { Check, X, ExternalLink } from "lucide-react"
import type { ReviewRequest } from "@/types/database"

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  accepted: "bg-emerald-100 text-emerald-800 border-emerald-200",
  completed: "bg-blue-100 text-blue-800 border-blue-200",
  declined: "bg-zinc-100 text-zinc-600 border-zinc-200",
}

export function RequestsList({ requests: initial }: { requests: ReviewRequest[] }) {
  const router = useRouter()
  const [requests, setRequests] = useState(initial)
  const [tab, setTab] = useState<"incoming" | "outgoing">("incoming")

  const incoming = requests.filter(r => r.status !== "completed" || tab === "incoming")
  const outgoing = requests.filter(r => r.student_id === requests.find(x => x.student)?.student_id)

  const handleAccept = async (request: ReviewRequest) => {
    const supabase = createClient()
    const { error } = await supabase.from("review_requests").update({ status: "accepted" }).eq("id", request.id)
    if (error) { toast.error("Failed to accept"); return }
    setRequests(prev => prev.map(r => r.id === request.id ? { ...r, status: "accepted" as const } : r))
    router.push(`/review/${request.project_id}?request_id=${request.id}`)
  }

  const handleDecline = async (request: ReviewRequest) => {
    const supabase = createClient()
    const { error } = await supabase.from("review_requests").update({ status: "declined" }).eq("id", request.id)
    if (error) { toast.error("Failed to decline"); return }
    setRequests(prev => prev.map(r => r.id === request.id ? { ...r, status: "declined" as const } : r))
    toast.success("Request declined")
  }

  const handleComplete = async (request: ReviewRequest) => {
    const supabase = createClient()
    const { error } = await supabase.from("review_requests").update({ status: "completed" }).eq("id", request.id)
    if (error) { toast.error("Failed to update"); return }
    setRequests(prev => prev.map(r => r.id === request.id ? { ...r, status: "completed" as const } : r))
  }

  const initials = (name?: string) => name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?"

  return (
    <div>
      {/* Tab switcher */}
      <div className="flex gap-1 mb-6 bg-zinc-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab("incoming")}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === "incoming" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700"}`}
        >
          Incoming
        </button>
        <button
          onClick={() => setTab("outgoing")}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === "outgoing" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700"}`}
        >
          Outgoing
        </button>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-zinc-100">
          <div className="h-16 w-16 bg-zinc-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📋</span>
          </div>
          <h3 className="font-semibold text-lg mb-1">No review requests yet</h3>
          <p className="text-sm text-zinc-500">
            {tab === "incoming" ? "When students request your review, they'll appear here." : "Send review requests to architects from their profile pages."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <Card key={req.id} className="border-zinc-200">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  {/* Student/Architect avatar */}
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src={(tab === "incoming" ? req.student : req.architect)?.avatar_url || undefined} />
                    <AvatarFallback className="bg-zinc-200 text-zinc-600 text-xs">
                      {initials(tab === "incoming" ? req.student?.full_name : req.architect?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">
                        {tab === "incoming" ? req.student?.full_name : req.architect?.full_name}
                      </span>
                      <Badge variant="outline" className={`text-xs ${STATUS_COLORS[req.status]}`}>
                        {req.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-zinc-600 mb-2">
                      Project: <span className="font-medium">{req.project?.title}</span>
                    </p>
                    {req.message && (
                      <p className="text-sm text-zinc-500 mb-3 italic">"{req.message}"</p>
                    )}
                    <p className="text-xs text-zinc-400 mb-3">
                      {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
                    </p>
                    {/* Action buttons */}
                    {tab === "incoming" && req.status === "pending" && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleAccept(req)} className="h-8">
                          <Check className="h-3.5 w-3.5 mr-1" /> Accept &amp; Review
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDecline(req)} className="h-8">
                          <X className="h-3.5 w-3.5 mr-1" /> Decline
                        </Button>
                      </div>
                    )}
                    {tab === "incoming" && req.status === "accepted" && (
                      <Button size="sm" variant="outline" onClick={() => router.push(`/review/${req.project_id}?request_id=${req.id}`)} className="h-8">
                        <ExternalLink className="h-3.5 w-3.5 mr-1" /> Write Review
                      </Button>
                    )}
                  </div>
                  {/* Project thumbnail */}
                  {req.project?.cover_image_url && (
                    <img src={req.project.cover_image_url} alt="" className="h-16 w-24 rounded-lg object-cover flex-shrink-0 hidden sm:block" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
