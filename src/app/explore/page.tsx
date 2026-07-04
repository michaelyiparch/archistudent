import { ProjectFeed } from "@/components/feed/project-feed"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"

export default function ExplorePage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Explore</h1>
        <p className="text-zinc-500 mt-1">Discover architecture projects from students worldwide</p>
      </div>
      <Suspense fallback={<ExploreSkeleton />}>
        <ProjectFeed />
      </Suspense>
    </main>
  )
}

function ExploreSkeleton() {
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
