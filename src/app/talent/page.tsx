import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/layout/navbar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Star, GraduationCap, Wrench, MapPin } from "lucide-react"
import Link from "next/link"
import type { Profile } from "@/types/database"

export default async function TalentPage() {
  const supabase = await createClient()

  // Get students with their stats
  const { data: students } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "student")
    .order("created_at", { ascending: false })
    .limit(50)

  // For each student, get project count and avg rating
  const enrichedStudents = await Promise.all(
    (students || []).map(async (s: Profile) => {
      const { data: projects } = await supabase
        .from("projects")
        .select("id, reviews(overall_rating)")
        .eq("user_id", s.id)

      const projectCount = projects?.length || 0
      const allRatings = (projects || []).flatMap((p: Record<string, unknown>) =>
        ((p.reviews as Array<{ overall_rating: number }>) || []).map((r) => r.overall_rating)
      )
      const avgRating = allRatings.length > 0
        ? allRatings.reduce((a: number, b: number) => a + b, 0) / allRatings.length
        : null

      return { ...s, projectCount, avgRating }
    })
  )

  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Discover Talent</h1>
          <p className="text-zinc-500 mt-2 max-w-2xl">
            Browse architecture students, their portfolios, and professional reviews.
            Find your next intern, collaborator, or hire.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrichedStudents.map((student) => {
            const initials = student.full_name
              ?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "?"

            return (
              <Card key={student.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <Link href={`/profile/${student.id}`}>
                      <Avatar className="h-14 w-14">
                        <AvatarImage src={student.avatar_url || undefined} />
                        <AvatarFallback className="bg-zinc-200 text-zinc-600">{initials}</AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link href={`/profile/${student.id}`} className="font-semibold hover:underline">
                          {student.full_name}
                        </Link>
                        {student.open_to_work && (
                          <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">🟢 Open</Badge>
                        )}
                      </div>
                      {student.university_or_firm && (
                        <p className="text-sm text-zinc-500 flex items-center gap-1 mt-0.5">
                          <GraduationCap className="h-3 w-3" /> {student.university_or_firm}
                        </p>
                      )}
                      {student.bio && (
                        <p className="text-sm text-zinc-600 mt-1.5 line-clamp-2">{student.bio}</p>
                      )}

                      {/* Skills */}
                      {student.skills && student.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {student.skills.slice(0, 4).map((s: string) => (
                            <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                          ))}
                        </div>
                      )}

                      {/* Stats */}
                      <div className="flex items-center gap-4 mt-3 text-sm">
                        <span className="text-zinc-500">
                          <span className="font-semibold text-zinc-900">{student.projectCount}</span> projects
                        </span>
                        {student.avgRating && (
                          <span className="flex items-center gap-1 text-zinc-500">
                            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                            <span className="font-semibold text-zinc-900">{student.avgRating.toFixed(1)}</span> avg
                          </span>
                        )}
                      </div>

                      <Link
                        href={`/profile/${student.id}`}
                        className={buttonVariants({ variant: "outline", size: "sm" }) + " w-full mt-3"}
                      >
                        View Portfolio
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </main>
    </>
  )
}
