import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/layout/navbar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Star, GraduationCap } from "lucide-react"
import Link from "next/link"
import type { Profile } from "@/types/database"

export default async function TalentPage() {
  const supabase = await createClient()

  // Step 1: Get all distinct user_ids that have at least 1 project
  const { data: activeUserIds } = await supabase
    .from("projects")
    .select("user_id")
    .order("created_at", { ascending: false })

  // Unique profile IDs with projects
  const profileIdsWithProjects = [...new Set((activeUserIds || []).map((p) => p.user_id))]

  if (profileIdsWithProjects.length === 0) {
    return (
      <>
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Discover Talent</h1>
            <p className="text-zinc-500 mt-2">No students have uploaded work yet. Be the first!</p>
          </div>
        </main>
      </>
    )
  }

  // Step 2: Fetch profiles for those who have projects, students only
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .in("id", profileIdsWithProjects)
    .eq("role", "student")
    .limit(50)

  const students = (profiles || []) as Profile[]
  const studentIds = students.map((s) => s.id)

  // Step 3: Batch-fetch project stats for all qualifying students
  const { data: allProjects } = await supabase
    .from("projects")
    .select("user_id, reviews(overall_rating)")
    .in("user_id", studentIds)

  // Build stats map: profileId → { count, avgRating }
  const statsMap = new Map<string, { count: number; avgRating: number | null }>()
  for (const p of allProjects || []) {
    const uid = p.user_id as string
    const entry = statsMap.get(uid) || { count: 0, avgRating: null }
    entry.count++
    const reviews = (p.reviews as Array<{ overall_rating: number }>) || []
    // Accumulate ratings for later averaging
    ;(entry as unknown as { ratings: number[] }).ratings = [
      ...((entry as unknown as { ratings: number[] }).ratings || []),
      ...reviews.map((r) => r.overall_rating),
    ]
    statsMap.set(uid, entry)
  }

  // Finalize averages
  for (const [uid, entry] of statsMap) {
    const ratings = (entry as unknown as { ratings: number[] }).ratings || []
    entry.avgRating =
      ratings.length > 0 ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : null
    // Clean up temporary property
    delete (entry as unknown as { ratings?: number[] }).ratings
  }

  // Step 4: Sort by project count descending (most active first)
  students.sort((a, b) => {
    const aCount = statsMap.get(a.id)?.count || 0
    const bCount = statsMap.get(b.id)?.count || 0
    return bCount - aCount
  })

  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Discover Talent</h1>
          <p className="text-zinc-500 mt-2 max-w-2xl">
            Browse architecture students with active portfolios, their work, and professional reviews.
            Find your next intern, collaborator, or hire.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {students.map((student) => {
            const stats = statsMap.get(student.id) || { count: 0, avgRating: null }
            const initials = (student.full_name as string)
              ?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "?"

            return (
              <Card key={student.id as string} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <Link href={`/profile/${student.id}`}>
                      <Avatar className="h-14 w-14">
                        <AvatarImage src={(student.avatar_url as string) || undefined} />
                        <AvatarFallback className="bg-zinc-200 text-zinc-600">{initials}</AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link href={`/profile/${student.id}`} className="font-semibold hover:underline">
                          {String(student.full_name || "")}
                        </Link>
                        {student.open_to_work && (
                          <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">🟢 Open</Badge>
                        )}
                      </div>
                      {student.university_or_firm && (
                        <p className="text-sm text-zinc-500 flex items-center gap-1 mt-0.5">
                          <GraduationCap className="h-3 w-3" /> {String(student.university_or_firm)}
                        </p>
                      )}
                      {student.bio && (
                        <p className="text-sm text-zinc-600 mt-1.5 line-clamp-2">{String(student.bio)}</p>
                      )}

                      {/* Skills */}
                      {Array.isArray(student.skills) && (student.skills as string[]).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {(student.skills as string[]).slice(0, 4).map((s: string) => (
                            <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                          ))}
                        </div>
                      )}

                      {/* Stats */}
                      <div className="flex items-center gap-4 mt-3 text-sm">
                        <span className="text-zinc-500">
                          <span className="font-semibold text-zinc-900">{stats.count}</span> project{stats.count !== 1 ? "s" : ""}
                        </span>
                        {stats.avgRating != null && stats.avgRating > 0 && (
                          <span className="flex items-center gap-1 text-zinc-500">
                            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                            <span className="font-semibold text-zinc-900">{stats.avgRating.toFixed(1)}</span> avg
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
