"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { ArrowLeft, Sparkles } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="h-8 w-8 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const registered = searchParams.get("registered")
  const redirectTo = searchParams.get("redirect") || "/"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [role, setRole] = useState<"student" | "professional">("student")
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error(error.message)
    } else {
      router.push(redirectTo)
      router.refresh()
    }
    setLoading(false)
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const result = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
      },
    })
    if (result.error) {
      toast.error(result.error.message || "Signup failed")
      console.error("Signup error:", result.error)
    } else if (result.data.user) {
      try {
        const { data: pd } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", result.data.user.id)
          .single()

        if (pd) {
          const { error: updateErr } = await supabase
            .from("profiles")
            .update({
              full_name: fullName.trim() || email.split("@")[0],
              role: role,
            })
            .eq("id", pd.id)

          if (updateErr) console.error("Profile update error:", updateErr)
        }
      } catch (e) {
        console.error("Profile setup error:", e)
      }

      toast.success("Welcome to ArchiStudent!")
      router.push(redirectTo)
      router.refresh()
    }
    setLoading(false)
  }

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) toast.error(error.message)
  }

  return (
    <div className="min-h-screen flex bg-zinc-50">
      {/* Left: Brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-zinc-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-amber-900/30" />
        <div className="relative flex flex-col justify-between p-12 text-white w-full">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-xl tracking-tight">
            <div className="h-9 w-9 bg-white rounded-lg flex items-center justify-center text-zinc-900 text-sm font-bold">
              A
            </div>
            ArchiStudent
          </Link>
          <div className="space-y-6">
            <h2 className="text-4xl font-bold leading-tight">
              Where student work<br />meets professional insight
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                </div>
                <div>
                  <p className="font-medium text-sm">Structured Professional Reviews</p>
                  <p className="text-sm text-zinc-400">Get detailed feedback on concept, execution, and presentation</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                </div>
                <div>
                  <p className="font-medium text-sm">Build Your Portfolio</p>
                  <p className="text-sm text-zinc-400">Showcase your work to the architecture community</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                </div>
                <div>
                  <p className="font-medium text-sm">Connect & Get Discovered</p>
                  <p className="text-sm text-zinc-400">Network with practicing architects and fellow students</p>
                </div>
              </div>
            </div>
          </div>
          <p className="text-sm text-zinc-500">
            Trusted by architecture students and professionals worldwide.
          </p>
        </div>
      </div>

      {/* Right: Auth form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-4">
          <div className="lg:hidden mb-6">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
              <div className="h-8 w-8 bg-zinc-900 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                A
              </div>
              ArchiStudent
            </Link>
          </div>

          <Link href="/" className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to home
          </Link>

          {registered && (
            <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl text-sm border border-emerald-200">
              Account created! Check your email to confirm, then sign in.
            </div>
          )}

          <Card className="border-zinc-200 shadow-sm">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl font-bold">Welcome back</CardTitle>
              <CardDescription>Sign in to your account or create a new one</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="signin">
                <TabsList className="w-full mb-6">
                  <TabsTrigger value="signin" className="flex-1">Sign In</TabsTrigger>
                  <TabsTrigger value="signup" className="flex-1">Create Account</TabsTrigger>
                </TabsList>

                <TabsContent value="signin">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" required />
                    </div>
                    <div className="space-y-2">
                      <Label>I am a...</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setRole("student")}
                          className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                            role === "student"
                              ? "border-zinc-900 bg-zinc-50 text-zinc-900"
                              : "border-zinc-200 text-zinc-500 hover:border-zinc-300"
                          }`}
                        >
                          🎓 Student
                        </button>
                        <button
                          type="button"
                          onClick={() => setRole("professional")}
                          className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                            role === "professional"
                              ? "border-zinc-900 bg-zinc-50 text-zinc-900"
                              : "border-zinc-200 text-zinc-500 hover:border-zinc-300"
                          }`}
                        >
                          🏛️ Architect
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signupEmail">Email</Label>
                      <Input id="signupEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signupPassword">Password</Label>
                      <Input id="signupPassword" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 characters" required minLength={6} />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Creating account..." : `Create ${role === "student" ? "Student" : "Architect"} Account`}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-zinc-400 font-medium">or continue with</span>
                </div>
              </div>

              <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </Button>
            </CardContent>
            <CardFooter className="text-center text-xs text-zinc-400 justify-center">
              By continuing, you agree to our Terms and Privacy Policy.
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
