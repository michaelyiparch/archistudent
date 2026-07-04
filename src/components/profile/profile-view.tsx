"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {
  Star, Heart, MessageSquare, MapPin, Calendar, Award,
  Briefcase, GraduationCap, Wrench, Globe, Send, Mail
} from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import { CATEGORY_LABELS } from "@/types/database"
import { RequestReviewDialog } from "@/components/review-requests/request-review-dialog"
import { FileText } from "lucide-react"
import type { Profile, Project, Review } from "@/types/database"

export function ProfileView({
  profile,
  projects,
  reviewsWritten,
}: {
  profile: Profile
  projects: Project[]
  reviewsWritten: Array<Review & { projects?: { id: string; title: string; cover_image_url: string | null } | null }>
}) {
  const { profile: currentProfile } = useAuth()
  const router = useRouter()
  const isOwner = currentProfile?.id === profile.id

  const [showContact, setShowContact] = useState(false)
  const [showRequestDialog, setShowRequestDialog] = useState(false)
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [verified, setVerified] = useState(profile.verified_professional)

  const handleVerify = async () => {
    const supabase = createClient()
    const newVal = !verified
    const { error } = await supabase.from("profiles").update({ verified_professional: newVal }).eq("id", profile.id)
    if (error) { toast.error("Failed to update"); return }
    setVerified(newVal)
    toast.success(newVal ? "Professional verified" : "Verification removed")
  }

  const initials = profile.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?"

  const totalLikes = projects.reduce((sum, p) => sum + (p.like_count || 0), 0)
  const totalReviews = projects.reduce((sum, p) => sum + (p.review_count || 0), 0)
  const ratedProjects = projects.filter(p => p.avg_rating != null && p.avg_rating > 0)
  const overallAvg = ratedProjects.length > 0
    ? ratedProjects.reduce((sum, p) => sum + (p.avg_rating || 0), 0) / ratedProjects.length
    : null

  const handleSendMessage = async () => {
    if (!message.trim() || !currentProfile) return
    setSending(true)
    const supabase = createClient()

    const { data: myProfile } = await supabase.from("profiles").select("id").eq("user_id", currentProfile.user_id).single()

    if (!myProfile) {
      toast.error("Could not send message")
      setSending(false)
      return
    }

    const { error } = await supabase.from("messages").insert({
      sender_id: myProfile.id,
      receiver_id: profile.id,
      content: message.trim(),
    })

    if (error) {
      toast.error("Failed to send message")
    } else {
      toast.success("Message sent!")
      setMessage("")
      setShowContact(false)
    }
    setSending(false)
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Profile header */}
      <div className="bg-zinc-50 rounded-2xl p-6 sm:p-8 mb-8">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <Avatar className="h-24 w-24 border-4 border-white shadow">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="text-2xl bg-zinc-200 text-zinc-600">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold">{profile.full_name}</h1>
              <Badge className="capitalize">{profile.role}</Badge>
              {profile.verified_professional && (
                <Badge variant="outline" className="text-blue-600 border-blue-300">✓ Verified</Badge>
              )}
              {profile.open_to_work && (
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
                  🟢 Open to opportunities
                </Badge>
              )}
            </div>
            <p className="text-zinc-600 mt-1.5 flex items-center gap-1">
              {profile.role === "student" ? "🎓 " : "🏢 "}
              {profile.university_or_firm || (profile.role === "student" ? "Architecture Student" : "Architecture Professional")}
            </p>
            {profile.bio && (
              <p className="text-sm text-zinc-600 mt-3 leading-relaxed max-w-xl">{profile.bio}</p>
            )}

            {/* Skills */}
            {profile.skills && profile.skills.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-3">
                <Wrench className="h-3.5 w-3.5 text-zinc-400 mr-1" />
                {profile.skills.map((s) => (
                  <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                ))}
              </div>
            )}

            {/* Education */}
            {profile.education && (
              <p className="text-sm text-zinc-600 mt-2 flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5 text-zinc-400" />
                {profile.education}
              </p>
            )}

            {/* Portfolio */}
            {profile.portfolio_url && (
              <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline mt-2 inline-flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" /> Portfolio
              </a>
            )}

            <div className="flex items-center gap-4 mt-3 text-sm text-zinc-500">
              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Joined {format(new Date(profile.created_at), "MMMM yyyy")}</span>
            </div>

            {/* Stats */}
            <div className="flex gap-6 mt-4">
              <div className="text-center"><p className="text-xl font-bold">{projects.length}</p><p className="text-xs text-zinc-500">Projects</p></div>
              <div className="text-center"><p className="text-xl font-bold">{totalLikes}</p><p className="text-xs text-zinc-500">Likes</p></div>
              <div className="text-center"><p className="text-xl font-bold">{totalReviews}</p><p className="text-xs text-zinc-500">Reviews</p></div>
              {overallAvg != null && (
                <div className="text-center">
                  <p className="text-xl font-bold flex items-center justify-center gap-0.5">
                    <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                    {overallAvg.toFixed(1)}
                  </p>
                  <p className="text-xs text-zinc-500">Avg Rating</p>
                </div>
              )}
              {profile.role === "professional" && (
                <div className="text-center"><p className="text-xl font-bold">{reviewsWritten.length}</p><p className="text-xs text-zinc-500">Reviews Given</p></div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 mt-4">
              {isOwner ? (
                <Button variant="outline" size="sm" onClick={() => router.push("/profile/edit")}>
                  Edit Profile
                </Button>
              ) : currentProfile ? (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setShowContact(!showContact)}>
                    <Mail className="mr-1.5 h-4 w-4" /> Contact
                  </Button>
                  {currentProfile.role === "student" && profile.role === "professional" && (
                    <Button size="sm" variant="secondary" onClick={() => setShowRequestDialog(true)}>
                      <FileText className="mr-1.5 h-4 w-4" /> Request Review
                    </Button>
                  )}
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={() => router.push("/auth/login")}>
                  Sign in to contact
                </Button>
              )}
            </div>

            {/* Admin: promote/demote + verify */}
            {currentProfile?.is_admin && (
              <div className="mt-3 flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" onClick={async () => {
                  const supabase = createClient()
                  const newRole = profile.role === "professional" ? "student" : "professional"
                  await supabase.from("profiles").update({ role: newRole }).eq("id", profile.id)
                  toast.success(newRole === "professional" ? "Promoted to architect" : "Demoted to student")
                  router.refresh()
                }}>
                  {profile.role === "professional" ? "Demote to Student" : "Promote to Architect"}
                </Button>
                {profile.role === "professional" && (
                  <Button size="sm" variant={verified ? "outline" : "default"} onClick={handleVerify}>
                    <Award className="mr-1.5 h-4 w-4" />
                    {verified ? "Unverify" : "Verify"}
                  </Button>
                )}
              </div>
            )}

            {/* Contact form */}
            {showContact && currentProfile && (
              <div className="mt-4 p-4 bg-white rounded-xl border space-y-3">
                <p className="text-sm font-medium">Send a message to {profile.full_name?.split(" ")[0] || profile.full_name || "them"}</p>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={`Hi, I saw your work on ArchiStudent and...`}
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSendMessage} disabled={!message.trim() || sending}>
                    <Send className="mr-1.5 h-3.5 w-3.5" /> {sending ? "Sending..." : "Send Message"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowContact(false)}>Cancel</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="projects">
        <TabsList>
          <TabsTrigger value="projects">Projects ({projects.length})</TabsTrigger>
          {profile.role === "professional" && (
            <TabsTrigger value="reviews">Reviews Given ({reviewsWritten.length})</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="projects" className="mt-6">
          {projects.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-4">🏗️</div>
              <p className="text-zinc-500">No projects yet</p>
              {isOwner && (
                <Button className="mt-4" onClick={() => router.push("/upload")}>Upload Your First Project</Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Card key={project.id} className="overflow-hidden border-zinc-200 hover:border-zinc-300 hover:shadow-md transition-all">
                  <Link href={`/project/${project.id}`}>
                    <div className="aspect-[4/3] bg-zinc-100 relative">
                      {project.cover_image_url ? (
                        <img src={project.cover_image_url} alt={project.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-4xl">🏛️</div>
                      )}
                      {project.avg_rating && (
                        <div className="absolute top-2 right-2 flex items-center gap-1 bg-white/90 backdrop-blur px-2 py-1 rounded-full text-xs font-medium">
                          <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> {project.avg_rating.toFixed(1)}
                        </div>
                      )}
                      <div className="absolute top-2 left-2">
                        <Badge variant="secondary" className="bg-white/90 backdrop-blur text-xs">{CATEGORY_LABELS[project.category]}</Badge>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold line-clamp-1">{project.title}</h3>
                      <p className="text-sm text-zinc-500 line-clamp-2 mt-1">{project.description}</p>
                      <div className="flex items-center gap-4 mt-3 text-sm text-zinc-500">
                        <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> {project.like_count}</span>
                        <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" /> {project.review_count}</span>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {profile.role === "professional" && (
          <TabsContent value="reviews" className="mt-6">
            {reviewsWritten.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-4xl mb-4">✍️</div>
                <p className="text-zinc-500">No reviews written yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviewsWritten.map((reviewData) => (
                  <Card key={reviewData.id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex gap-4">
                        <Link href={`/project/${reviewData.projects?.id}`} className="h-16 w-24 rounded-lg overflow-hidden bg-zinc-100 flex-shrink-0">
                          {reviewData.projects?.cover_image_url ? (
                            <img src={reviewData.projects.cover_image_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-xl">🏛️</div>
                          )}
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link href={`/project/${reviewData.projects?.id}`} className="font-medium hover:underline">
                            {reviewData.projects?.title || "Untitled Project"}
                          </Link>
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                            <span className="text-sm font-medium">{reviewData.overall_rating}/5</span>
                          </div>
                          <p className="text-sm text-zinc-600 mt-2 line-clamp-2">{reviewData.comment}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      <RequestReviewDialog
        architectId={profile.id}
        architectName={profile.full_name}
        open={showRequestDialog}
        onOpenChange={setShowRequestDialog}
      />
    </main>
  )
}
