'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LogOut, BookOpen, Heart, History } from 'lucide-react'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeReadingCount, setActiveReadingCount] = useState(0)
  const [wishlistCount, setWishlistCount] = useState(0)
  const [booksReadCount, setBooksReadCount] = useState(0)
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push('/auth/login')
          return
        }

        setUser(user)
      } catch (error) {
        console.error('Error fetching user:', error)
        router.push('/auth/login')
      } finally {
        setLoading(false)
      }
    }

    getUser()
  }, [router, supabase])

  const fetchStats = useCallback(async () => {
    if (!user) return

    try {
      const startOfYear = new Date(new Date().getFullYear(), 0, 1).toISOString()

      const [activeRes, wishRes, readRes] = await Promise.all([
        supabase
          .from('book_borrows')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .in('status', ['borrowed', 'overdue']),
        supabase
          .from('wishlist')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('book_borrows')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'returned')
          .gte('return_date', startOfYear),
      ])

      if (activeRes.error) console.error('Error fetching active reading count:', activeRes.error)
      if (wishRes.error) console.error('Error fetching wishlist count:', wishRes.error)
      if (readRes.error) console.error('Error fetching books read count:', readRes.error)

      setActiveReadingCount(activeRes.count ?? 0)
      setWishlistCount(wishRes.count ?? 0)
      setBooksReadCount(readRes.count ?? 0)
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    }
  }, [supabase, user])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    const onFocus = () => fetchStats()
    const onVisibility = () => {
      if (document.visibilityState === 'visible') fetchStats()
    }

    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [fetchStats])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-blue-50 to-purple-50 dark:from-background dark:via-primary/5 dark:to-accent/5">
        <nav className="border-b border-primary/10 bg-white/60 dark:bg-foreground/5 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-10 w-24" />
          </div>
        </nav>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Skeleton className="h-12 w-48 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-blue-50 to-purple-50 dark:from-background dark:via-primary/5 dark:to-accent/5">
      {/* Navigation */}
      <nav className="border-b border-primary/10 bg-white/60 dark:bg-foreground/5 backdrop-blur-xl sticky top-0 z-50 shadow-lg shadow-primary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-primary to-accent p-2 rounded-xl">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              BookVault
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-foreground/60 font-medium hidden sm:inline">{user?.email}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-2 border-primary/30 text-foreground hover:text-primary hover:border-primary hover:bg-primary/5"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Welcome to Your Library
          </h1>
          <p className="text-slate-600">
            Manage your books, wishlists, and reading history all in one place.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Link href="/library">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader className="pb-3">
                <BookOpen className="h-8 w-8 text-slate-900 mb-2" />
                <CardTitle>Browse Library</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-sm">
                  Explore thousands of books across all genres
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/wishlist">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader className="pb-3">
                <Heart className="h-8 w-8 text-slate-900 mb-2" />
                <CardTitle>My Wishlist</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-sm">
                  View and manage books on your wishlist
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/reading">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader className="pb-3">
                <History className="h-8 w-8 text-slate-900 mb-2" />
                <CardTitle>My Reading</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-sm">
                  Track your reading progress and history
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Currently Reading</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-900">{activeReadingCount}</p>
              <p className="text-sm text-slate-600 mt-1">Books you're reading now</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Wishlist Items</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-900">{wishlistCount}</p>
              <p className="text-sm text-slate-600 mt-1">Books saved for later</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Books Read</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-900">{booksReadCount}</p>
              <p className="text-sm text-slate-600 mt-1">Books read this year</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
