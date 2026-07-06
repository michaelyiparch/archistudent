"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useNotifications } from "@/components/notifications/use-notifications"
import { createClient } from "@/lib/supabase/client"
import { Button, buttonVariants } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Upload, Search, LogOut, User, Menu, X, Compass, Mail, Users, ClipboardList, Bell } from "lucide-react"
import { toast } from "sonner"

export function Navbar() {
  const { user, profile, loading } = useAuth()
  const { total, unreadMessages, pendingRequests } = useNotifications()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    setSigningOut(true)
    const supabase = createClient()
    try {
      await supabase.auth.signOut()
      toast.success("Signed out")
      router.push("/")
      router.refresh()
    } catch {
      toast.error("Failed to sign out")
    } finally {
      setSigningOut(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery("")
    }
  }

  const initials = profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?"

  const ghostLinkClass = cn(buttonVariants({ variant: "ghost", size: "sm" }))

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Left: Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-lg tracking-tight">
            <div className="h-8 w-8 bg-zinc-900 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-sm">
              A
            </div>
            <span className="hidden sm:inline">ArchiStudent</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Link href="/explore" className={ghostLinkClass}>
              <Compass className="h-4 w-4 mr-1.5" /> Explore
            </Link>
            <Link href="/talent" className={ghostLinkClass}>
              <Users className="h-4 w-4 mr-1.5" /> Architects
            </Link>
            {user && (
              <Link href="/upload" className={ghostLinkClass}>
                <Upload className="h-4 w-4 mr-1.5" /> Upload
              </Link>
            )}
          </nav>
        </div>

        {/* Center: Search */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-sm mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              type="search"
              placeholder="Search projects and people..."
              className="pl-9 bg-zinc-100 border-transparent focus:bg-white focus:border-zinc-300 rounded-xl h-9 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>

        {/* Right: Auth */}
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="h-8 w-8 rounded-full bg-zinc-100 animate-pulse" />
          ) : user ? (
            <>
              {/* Notification bell */}
              {total > 0 && (
                <Link
                  href={pendingRequests > 0 ? "/requests" : "/messages"}
                  className="relative p-2 rounded-full hover:bg-zinc-100 transition-colors"
                >
                  <Bell className="h-5 w-5 text-zinc-600" />
                  <span className="absolute -top-0.5 -right-0.5 h-5 w-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                    {total > 9 ? "9+" : total}
                  </span>
                </Link>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger className="relative">
                  <Avatar className="h-8 w-8 cursor-pointer ring-2 ring-transparent hover:ring-zinc-200 transition-all">
                    <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || "User"} />
                    <AvatarFallback className="text-xs bg-zinc-900 text-white">{initials}</AvatarFallback>
                  </Avatar>
                  {total > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                      {total > 9 ? "9+" : total}
                    </span>
                  )}
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{profile?.full_name || "User"}</p>
                      <p className="text-xs text-zinc-500 capitalize leading-none mt-1">{profile?.role || "user"}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {profile?.id && (
                  <DropdownMenuItem onClick={() => router.push(`/profile/${profile.id}`)}>
                    <User className="mr-2 h-4 w-4" /> Profile
                  </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => router.push("/profile/edit")}>
                    <User className="mr-2 h-4 w-4" /> Edit Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/messages")} className="justify-between">
                    <span className="flex items-center">
                      <Mail className="mr-2 h-4 w-4" /> Messages
                    </span>
                    {unreadMessages > 0 && (
                      <span className="h-5 min-w-5 px-1 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                        {unreadMessages > 9 ? "9+" : unreadMessages}
                      </span>
                    )}
                  </DropdownMenuItem>
                  {profile?.role === "professional" && (
                    <DropdownMenuItem onClick={() => router.push("/requests")} className="justify-between">
                      <span className="flex items-center">
                        <ClipboardList className="mr-2 h-4 w-4" /> Review Requests
                      </span>
                      {pendingRequests > 0 && (
                        <span className="h-5 min-w-5 px-1 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                          {pendingRequests > 9 ? "9+" : pendingRequests}
                        </span>
                      )}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => router.push("/upload")}>
                    <Upload className="mr-2 h-4 w-4" /> Upload Project
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} disabled={signingOut}>
                    <LogOut className="mr-2 h-4 w-4" /> {signingOut ? "Signing out..." : "Sign Out"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                Sign In
              </Link>
              <Link href="/auth/login" className={buttonVariants({ size: "sm" })}>
                Get Started
              </Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-white p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                type="search"
                placeholder="Search..."
                className="pl-9 bg-zinc-100 border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>
          <div className="flex flex-col gap-1">
            <Link
              href="/explore"
              className={cn(buttonVariants({ variant: "ghost" }), "justify-start")}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Compass className="mr-2 h-4 w-4" /> Explore
            </Link>
            <Link
              href="/talent"
              className={cn(buttonVariants({ variant: "ghost" }), "justify-start")}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Users className="mr-2 h-4 w-4" /> Architects
            </Link>
            {user && (
              <Link
                href="/upload"
                className={cn(buttonVariants({ variant: "ghost" }), "justify-start")}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Upload className="mr-2 h-4 w-4" /> Upload Project
              </Link>
            )}
            {user && (
              <>
                <div className="h-px bg-zinc-100 my-1" />
                <Link
                  href="/messages"
                  className={cn(buttonVariants({ variant: "ghost" }), "justify-start", "justify-between")}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="flex items-center">
                    <Mail className="mr-2 h-4 w-4" /> Messages
                  </span>
                  {unreadMessages > 0 && (
                    <span className="h-5 min-w-5 px-1 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                      {unreadMessages > 9 ? "9+" : unreadMessages}
                    </span>
                  )}
                </Link>
                {profile?.role === "professional" && (
                  <Link
                    href="/requests"
                    className={cn(buttonVariants({ variant: "ghost" }), "justify-start", "justify-between")}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="flex items-center">
                      <ClipboardList className="mr-2 h-4 w-4" /> Review Requests
                    </span>
                    {pendingRequests > 0 && (
                      <span className="h-5 min-w-5 px-1 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                        {pendingRequests > 9 ? "9+" : pendingRequests}
                      </span>
                    )}
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
