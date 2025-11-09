"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSupabaseClient } from "@/lib/supabase/use-supabase"
import { AuthForm } from "@/components/auth-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Leaf } from "lucide-react"

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = useSupabaseClient()

  const handleSignup = async (data: {
    email: string
    password: string
    name?: string
  }) => {
    setIsLoading(true)
    setError(null)
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/onboarding`,
          data: {
            full_name: data.name || "",
          },
        },
      })

      if (authError) throw authError

      if (authData.user) {
        router.push("/onboarding")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
              <Leaf className="w-6 h-6 text-accent-foreground" />
            </div>
            <span className="text-2xl font-bold text-accent">Serenify</span>
          </Link>
        </div>

        <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Join Serenify</CardTitle>
            <p className="text-foreground/70 text-sm mt-2">Start your wellness journey today</p>
          </CardHeader>

          <CardContent className="space-y-6">
            <AuthForm type="signup" onSubmit={handleSignup} isLoading={isLoading} />

            {error && <div className="text-red-500 text-sm text-center">{error}</div>}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-foreground/70">or</span>
              </div>
            </div>

            <p className="text-center text-foreground/70">
              Already have an account?{" "}
              <Link href="/login" className="text-accent hover:text-accent/80 font-medium">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-foreground/50 text-xs mt-6">
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </main>
  )
}
