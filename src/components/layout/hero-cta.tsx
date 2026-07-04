"use client"

import { useAuth } from "@/lib/auth-context"
import { buttonVariants } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

export function HeroCTA() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10">
        <div className="h-11 w-48 bg-zinc-100 rounded-lg animate-pulse" />
        <div className="h-11 w-40 bg-zinc-100 rounded-lg animate-pulse" />
      </div>
    )
  }

  return (
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
      <Link href="/explore" className={buttonVariants({ variant: "outline", size: "lg" })}>
        Browse Projects
      </Link>
    </div>
  )
}
