import { Suspense } from "react"
import { TalentGrid } from "@/components/talent/talent-grid"
import { Skeleton } from "@/components/ui/skeleton"

export default function TalentPage() {
  return (
    <>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Architect Pool</h1>
          <p className="text-zinc-500 mt-2 max-w-2xl">
            Browse practicing architects available to review your work. Each architect
            provides rubric-based feedback on concept, execution, and presentation.
          </p>
        </div>

        <Suspense fallback={<TalentGridSkeleton />}>
          <TalentGrid />
        </Suspense>
      </main>
    </>
  )
}

function TalentGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="p-5 rounded-xl border border-zinc-100 space-y-3">
          <div className="flex items-start gap-4">
            <Skeleton className="h-14 w-14 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-9 w-full mt-2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
