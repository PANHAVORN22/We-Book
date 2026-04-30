'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-6">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Authentication Error</h1>
          <p className="text-slate-600">
            Something went wrong during authentication. Please try again.
          </p>
        </div>

        <div className="space-y-3">
          <Link href="/auth/login" className="block">
            <Button className="w-full h-11 bg-slate-900 hover:bg-slate-800">
              Try Signing In Again
            </Button>
          </Link>
          <Link href="/auth/sign-up" className="block">
            <Button variant="outline" className="w-full h-11">
              Create New Account
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
