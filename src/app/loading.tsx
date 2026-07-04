import { Navbar } from "@/components/layout/navbar"

export default function RootLoading() {
  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-zinc-200/60 overflow-hidden">
              <div className="aspect-[4/3] bg-zinc-100 animate-pulse" />
              <div className="p-4 space-y-3">
                <div className="h-3 w-2/3 bg-zinc-100 rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-zinc-100 rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-zinc-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  )
}
