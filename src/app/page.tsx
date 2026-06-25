import { Navbar } from "@/components/layout/navbar"
import { ProjectFeed } from "@/components/feed/project-feed"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { buttonVariants } from "@/components/ui/button"
import { ArrowRight, Lightbulb, PenTool, Eye, Award, Star } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-amber-50/40 via-white to-white">
          <div className="container mx-auto px-4 py-20 md:py-28 relative">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100/80 text-amber-800 text-sm font-medium mb-8">
                <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                Beyond likes — structured professional critique
              </div>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-zinc-900 leading-tight">
                Your work, reviewed by{" "}
                <span className="text-amber-600">practicing architects</span>
              </h1>
              <p className="mt-6 text-lg md:text-xl text-zinc-500 max-w-2xl mx-auto leading-relaxed">
                Not just likes and comments. Get detailed rubric-based feedback on concept, execution,
                and presentation from professionals who shape the built world.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10">
                {user ? (
                  <Link href="/upload" className={buttonVariants({ size: "lg" })}>
                    Share Your Project <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                ) : (
                  <Link href="/auth/login" className={buttonVariants({ size: "lg" })}>
                    Join the Community <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                )}
                <Link href="#feed" className={buttonVariants({ variant: "outline", size: "lg" })}>
                  Browse Projects
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* The Rubric — what makes this different */}
        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold tracking-tight">Real critique, not just likes</h2>
              <p className="mt-3 text-zinc-500 text-lg max-w-xl mx-auto">
                Every professional review rates your work across four dimensions — the same criteria
                used in architecture school critiques and firm reviews.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Lightbulb, label: "Concept", desc: "Originality, clarity of idea, design intent", color: "bg-amber-50 text-amber-700" },
                { icon: PenTool, label: "Execution", desc: "Technical skill, detailing, constructability", color: "bg-blue-50 text-blue-700" },
                { icon: Eye, label: "Presentation", desc: "Visual communication, drawing quality", color: "bg-emerald-50 text-emerald-700" },
                { icon: Award, label: "Overall", desc: "Professional quality and impression", color: "bg-violet-50 text-violet-700" },
              ].map((dim) => (
                <div key={dim.label} className="text-center p-6 rounded-2xl border border-zinc-100 hover:border-zinc-200 hover:shadow-sm transition-all">
                  <div className={`h-12 w-12 rounded-xl ${dim.color} flex items-center justify-center mx-auto mb-4`}>
                    <dim.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-lg">{dim.label}</h3>
                  <p className="text-sm text-zinc-500 mt-2 leading-relaxed">{dim.desc}</p>
                  <div className="flex items-center justify-center gap-1 mt-3">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} className="h-3 w-3 fill-zinc-300 text-zinc-300" />
                    ))}
                    <span className="text-xs text-zinc-400 ml-1">1–5</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 md:py-24 bg-zinc-50/50">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold tracking-tight">How it works</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="relative text-center">
                <div className="h-12 w-12 rounded-full bg-zinc-900 text-white flex items-center justify-center mx-auto mb-4 font-bold text-lg">1</div>
                <h3 className="font-semibold text-lg">Upload your work</h3>
                <p className="text-sm text-zinc-500 mt-2 leading-relaxed">
                  Share studio projects, competition entries, and design explorations with the community.
                </p>
              </div>
              <div className="relative text-center">
                <div className="h-12 w-12 rounded-full bg-zinc-900 text-white flex items-center justify-center mx-auto mb-4 font-bold text-lg">2</div>
                <h3 className="font-semibold text-lg">Get rubric reviews</h3>
                <p className="text-sm text-zinc-500 mt-2 leading-relaxed">
                  Practicing architects rate your work on concept, execution, presentation, and overall design.
                </p>
              </div>
              <div className="relative text-center">
                <div className="h-12 w-12 rounded-full bg-zinc-900 text-white flex items-center justify-center mx-auto mb-4 font-bold text-lg">3</div>
                <h3 className="font-semibold text-lg">Grow your portfolio</h3>
                <p className="text-sm text-zinc-500 mt-2 leading-relaxed">
                  Build your online presence with verified professional feedback that sets you apart.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Project Feed */}
        <section id="feed" className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="mb-8">
              <h2 className="text-3xl font-bold tracking-tight">Discover Projects</h2>
              <p className="text-zinc-500 mt-1">Explore work from architecture students worldwide</p>
            </div>
            <Suspense fallback={<FeedSkeleton />}>
              <ProjectFeed />
            </Suspense>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t bg-white py-12">
          <div className="container mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-2 font-bold text-xl mb-4">
              <div className="h-8 w-8 bg-zinc-900 rounded-lg flex items-center justify-center text-white text-sm font-bold">A</div>
              ArchiStudent
            </div>
            <p className="text-sm text-zinc-400">Where student work meets professional insight.</p>
          </div>
        </footer>
      </main>
    </>
  )
}

function FeedSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-3 bg-white rounded-xl p-3 border border-zinc-100">
          <Skeleton className="aspect-[4/3] w-full rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  )
}
