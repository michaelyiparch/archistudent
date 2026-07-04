import { Skeleton } from "@/components/ui/skeleton"

export default function ProjectLoading() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="aspect-[16/10] w-full rounded-xl" />
            <div className="flex gap-2">
              <Skeleton className="h-16 w-24 rounded-lg" />
              <Skeleton className="h-16 w-24 rounded-lg" />
              <Skeleton className="h-16 w-24 rounded-lg" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-5 w-1/4" />
            </div>
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-60 w-full rounded-xl" />
          </div>
        </div>
      </main>
  )
}
