'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle2, BookOpen } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL
  const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD

  const redirectByRole = async (userId: string) => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (error || !profile?.role) {
      router.push('/dashboard')
      return
    }

    router.push(profile.role === 'admin' ? '/admin' : '/dashboard')
  }

  const ensureAdminAccount = async () => {
    const response = await fetch('/api/admin/bootstrap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      let message = 'Failed to prepare admin account'
      try {
        const body = await response.json()
        if (body?.error) message = body.error
      } catch {
        // Ignore JSON parse errors and use fallback message.
      }
      throw new Error(message)
    }
  }

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) throw error

      setSuccess(true)
      const userId = data.user?.id
      if (userId) {
        await redirectByRole(userId)
        return
      }
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  const handleAdminLogin = async () => {
    setError('')
    setLoading(true)

    if (!adminEmail || !adminPassword) {
      setError('Admin credentials are not configured. Set NEXT_PUBLIC_ADMIN_EMAIL and NEXT_PUBLIC_ADMIN_PASSWORD.')
      setLoading(false)
      return
    }

    try {
      await ensureAdminAccount()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: adminPassword,
      })

      if (error) throw error

      setSuccess(true)
      const userId = data.user?.id
      if (userId) {
        await redirectByRole(userId)
        return
      }
      router.push('/admin')
    } catch (err: any) {
      setError(err.message || 'Failed to sign in as admin')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-block bg-primary p-3 rounded-lg mb-4">
            <BookOpen className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">BookVault</h1>
          <p className="text-foreground/60">Your personal digital library</p>
        </div>

        {/* Card */}
        <Card className="border border-border shadow-sm">
          <CardHeader className="border-b border-border bg-secondary">
            <CardTitle className="text-2xl text-foreground">Sign In</CardTitle>
            <CardDescription className="text-foreground/60 mt-2">
              Sign in with your email and password
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-6 bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">Signed in! Redirecting...</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-foreground mb-2">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="h-10"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-foreground mb-2">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="h-10"
                />
              </div>

              <Button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full h-10 bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={handleAdminLogin}
                className="w-full h-10"
              >
                Sign in as Admin
              </Button>

              <div className="text-center text-sm">
                <span className="text-foreground/60">Don&apos;t have an account? </span>
                <Link href="/auth/sign-up" className="font-semibold text-primary hover:underline">
                  Sign up
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-foreground/50 mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}
