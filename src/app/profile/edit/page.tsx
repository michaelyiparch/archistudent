"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"
import { Navbar } from "@/components/layout/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { ArrowLeft, Camera, X, Plus } from "lucide-react"
import Link from "next/link"

export default function EditProfilePage() {
  const { profile, loading: authLoading, refreshProfile } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [fullName, setFullName] = useState(profile?.full_name || "")
  const [universityOrFirm, setUniversityOrFirm] = useState(profile?.university_or_firm || "")
  const [bio, setBio] = useState(profile?.bio || "")
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "")
  const [education, setEducation] = useState(profile?.education || "")
  const [portfolioUrl, setPortfolioUrl] = useState(profile?.portfolio_url || "")
  const [openToWork, setOpenToWork] = useState(profile?.open_to_work || false)
  const [skills, setSkills] = useState<string[]>(profile?.skills || [])
  const [skillInput, setSkillInput] = useState("")
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  if (authLoading) return null
  if (!profile) {
    router.replace("/auth/login?redirect=/profile/edit")
    return null
  }

  const initials = fullName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?"

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return }

    setUploading(true)
    const supabase = createClient()
    const ext = file.name.split(".").pop() || "jpg"
    const filename = `avatar-${Date.now()}.${ext}`
    const path = `${profile.user_id}/${filename}`

    const { data, error } = await supabase.storage.from("project-images").upload(path, file, { upsert: true })
    if (error) { toast.error("Failed to upload avatar") }
    else {
      const { data: urlData } = supabase.storage.from("project-images").getPublicUrl(data.path)
      setAvatarUrl(urlData.publicUrl)
      toast.success("Avatar updated")
    }
    setUploading(false)
  }

  const addSkill = () => {
    const s = skillInput.trim()
    if (s && !skills.includes(s) && skills.length < 20) {
      setSkills([...skills, s])
      setSkillInput("")
    }
  }

  const removeSkill = (s: string) => setSkills(skills.filter((sk) => sk !== s))

  const handleSave = async () => {
    if (!fullName.trim()) { toast.error("Name is required"); return }
    setSaving(true)
    const supabase = createClient()

    const { data: profileData } = await supabase
      .from("profiles").select("id").eq("user_id", profile.user_id).single()

    if (!profileData) { toast.error("Profile not found"); setSaving(false); return }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        university_or_firm: universityOrFirm.trim() || null,
        bio: bio.trim() || null,
        avatar_url: avatarUrl || null,
        education: education.trim() || null,
        portfolio_url: portfolioUrl.trim() || null,
        open_to_work: openToWork,
        skills: skills.length > 0 ? skills : null,
      })
      .eq("id", profileData.id)

    if (error) { toast.error(error.message) }
    else {
      await refreshProfile()
      toast.success("Profile saved!")
      router.push(`/profile/${profile.id}`)
    }
    setSaving(false)
  }

  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-xl">
        <Link href={`/profile/${profile.id}`} className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-900 mb-6">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to profile
        </Link>

        <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>

        {/* Avatar */}
        <Card>
          <CardHeader><CardTitle>Avatar</CardTitle><CardDescription>Your profile photo</CardDescription></CardHeader>
          <CardContent className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback className="text-xl">{initials}</AvatarFallback>
              </Avatar>
              <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-zinc-900 text-white flex items-center justify-center hover:bg-zinc-700 text-xs">
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarUpload} className="hidden" />
            <div>
              <p className="text-sm font-medium">Click the camera icon to upload</p>
              <p className="text-xs text-zinc-500">JPEG, PNG, or WebP. Max 5MB.</p>
              {uploading && <p className="text-xs text-blue-500 mt-1">Uploading...</p>}
            </div>
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card className="mt-4">
          <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org">{profile.role === "student" ? "University" : "Firm"}</Label>
              <Input id="org" value={universityOrFirm} onChange={(e) => setUniversityOrFirm(e.target.value)} placeholder={profile.role === "student" ? "e.g. MIT Architecture" : "e.g. Foster + Partners"} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="education">Education</Label>
              <Input id="education" value={education} onChange={(e) => setEducation(e.target.value)} placeholder="e.g. B.Arch, MIT 2026" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us about yourself..." rows={4} />
            </div>
          </CardContent>
        </Card>

        {/* Skills */}
        <Card className="mt-4">
          <CardHeader><CardTitle>Skills</CardTitle><CardDescription>Add software and design skills (max 20)</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <Badge key={s} variant="secondary" className="gap-1 pr-1">
                  {s}
                  <button onClick={() => removeSkill(s)} className="ml-1 hover:text-red-500"><X className="h-3 w-3" /></button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                placeholder="e.g. Rhino, Revit, Grasshopper..."
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill() } }}
              />
              <Button variant="outline" size="icon" onClick={addSkill} disabled={!skillInput.trim()}><Plus className="h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>

        {/* Career */}
        <Card className="mt-4">
          <CardHeader><CardTitle>Career</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="portfolio">Portfolio URL</Label>
              <Input id="portfolio" value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} placeholder="https://yourportfolio.com" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Open to opportunities</Label>
                <p className="text-xs text-zinc-500">Let firms and collaborators know you&apos;re available</p>
              </div>
              <Switch checked={openToWork} onCheckedChange={setOpenToWork} />
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={saving} className="w-full mt-6">
          {saving ? "Saving..." : "Save Profile"}
        </Button>
      </main>
    </>
  )
}
