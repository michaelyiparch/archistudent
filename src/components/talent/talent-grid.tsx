import { createClient } from "@/lib/supabase/server"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Briefcase, Award } from "lucide-react"
import Link from "next/link"
import type { Profile } from "@/types/database"

export async function TalentGrid() {
  const supabase = await createClient()

  // Fetch profiles and review stats in parallel
  const [profilesResult, reviewResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("role", "professional")
      .eq("verified_professional", true)
      .order("full_name"),
    supabase
      .from("reviews")
      .select("reviewer_id, overall_rating"),
  ])

  const professionals = (profilesResult.data || []) as Profile[]
  const reviewData = reviewResult.data || []

  const statsMap = new Map<string, { count: number; ratings: number[] }>()
  for (const r of reviewData) {
    const entry = statsMap.get(r.reviewer_id) || { count: 0, ratings: [] }
    entry.count++
    entry.ratings.push(r.overall_rating)
    statsMap.set(r.reviewer_id, entry)
  }

  if (professionals.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-zinc-100">
        <div className="h-20 w-20 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">🏛️</span>
        </div>
        <h3 className="text-xl font-semibold mb-2">No architects yet</h3>
        <p className="text-zinc-500">Professional architects will appear here once they join.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {professionals.map((pro) => {
        const stats = statsMap.get(pro.id)
        const count = stats?.count || 0

        const initials = (pro.full_name || "")
          .split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "?"

        return (
          <Card key={pro.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <Link href={`/profile/${pro.id}`}>
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={(pro.avatar_url as string) || undefined} />
                    <AvatarFallback className="bg-zinc-900 text-white">{initials}</AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link href={`/profile/${pro.id}`} className="font-semibold hover:underline">
                      {String(pro.full_name || "")}
                    </Link>
                    {pro.verified_professional && (
                      <Badge className="bg-blue-100 text-blue-700 text-[10px]">
                        <Award className="h-3 w-3 mr-0.5" /> Verified
                      </Badge>
                    )}
                  </div>
                  {pro.university_or_firm && (
                    <p className="text-sm text-zinc-500 flex items-center gap-1 mt-0.5">
                      <Briefcase className="h-3 w-3" /> {String(pro.university_or_firm)}
                    </p>
                  )}
                  {pro.bio && (
                    <p className="text-sm text-zinc-600 mt-1.5 line-clamp-2">{String(pro.bio)}</p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 mt-3 text-sm">
                    <span className="text-zinc-500">
                      <span className="font-semibold text-zinc-900">{count}</span> review{count !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <Link
                    href={`/profile/${pro.id}`}
                    className={buttonVariants({ variant: "outline", size: "sm" }) + " w-full mt-3"}
                  >
                    View Profile
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
