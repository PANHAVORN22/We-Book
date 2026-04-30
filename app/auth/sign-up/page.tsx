'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle2, BookOpen } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [adminCode, setAdminCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  const assignAdminRole = async (userId: string, userEmail: string, code: string) => {
    const response = await fetch('/api/admin/assign-role', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, email: userEmail, code }),
    })

    let message = 'Failed to apply admin code. Account created as normal user.'
    let assigned = false

    try {
      const body = await response.json()
      if (body?.assigned === true) assigned = true
      if (body?.error) message = body.error
    } catch {
      // Ignore JSON parse errors and use fallback message.
    }

    return { ok: response.ok, assigned, message }
  }

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      setSuccess(true)

      const cleanedAdminCode = adminCode.trim()
      if (cleanedAdminCode) {
        const userId = data.user?.id
        if (!userId) {
          setError(
            'Admin code provided, but the account id is missing. Account created as normal user.',
          )
          return
        }

        const result = await assignAdminRole(userId, email, cleanedAdminCode)
        if (!result.ok || !result.assigned) {
          setError(result.message)
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create account')
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
          <p className="text-foreground/60">Discover and borrow books online</p>
        </div>

        {/* Card */}
        <Card className="border border-border shadow-sm">
          <CardHeader className="border-b border-border bg-secondary">
            <CardTitle className="text-2xl text-foreground">Create Account</CardTitle>
            <CardDescription className="text-foreground/60 mt-2">
              Sign up with your email and password to get started
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
                <AlertDescription className="text-green-800">
                  Check your email to confirm your account.
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSignUp} className="space-y-4">
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

              <div>
                <label htmlFor="admin-code" className="block text-sm font-semibold text-foreground mb-2">
                  Admin Code (optional)
                </label>
                <Input
                  id="admin-code"
                  type="text"
                  placeholder="Enter admin code"
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  disabled={loading}
                  className="h-10"
                />
              </div>

              <Button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full h-10 bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>

              <div className="text-center text-sm">
                <span className="text-foreground/60">Already have an account? </span>
                <Link href="/auth/login" className="font-semibold text-primary hover:underline">
                  Sign in
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-foreground/50 mt-6">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}
