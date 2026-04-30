'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { BookOpen, LogOut, Heart, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from '@/hooks/use-toast'

interface WishlistItem {
  id: string
  book_id: string
  book: {
    id: string
    title: string
    author: string
    cover_url: string
    category: string
    available_copies: number
  }
  added_at: string
}

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [fetchError, setFetchError] = useState('')
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const fallbackCover = '/covers/cover-placeholder.svg'

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      setUser(user)
    }

    getUser()
  }, [supabase, router])

  useEffect(() => {
    const fetchWishlist = async () => {
      if (!user) return

      try {
        setFetchError('')
        const { data, error } = await supabase
          .from('wishlist')
          .select(
            `
            id,
            book_id,
            added_at,
            book:book_id (id, title, author, cover_url, category, available_copies)
          `
          )
          .eq('user_id', user.id)
          .order('added_at', { ascending: false })

        if (error) {
          setFetchError(error.message || 'Unable to load wishlist right now.')
          setWishlist([])
          return
        }

        setWishlist(data || [])
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to load wishlist right now.'
        setFetchError(message)
        setWishlist([])
      } finally {
        setLoading(false)
      }
    }

    fetchWishlist()
  }, [user, supabase])

  const handleRemoveFromWishlist = async (wishlistId: string) => {
    try {
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('id', wishlistId)

      if (error) throw error

      setWishlist(wishlist.filter((item) => item.id !== wishlistId))
    } catch (error: any) {
      alert('Error removing from wishlist: ' + error.message)
    }
  }

  const handleRead = async (bookId: string) => {
    if (!user?.id) {
      toast({
        title: 'Please sign in',
        description: 'You need to be signed in to read books.',
        variant: 'destructive',
      })
      router.push('/auth/login')
      return
    }

    try {
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 14)

      await supabase.from('book_borrows').insert([
        {
          user_id: user.id,
          book_id: bookId,
          due_date: dueDate.toISOString(),
        },
      ])
    } catch {
      // Ignore – still open reader
    }

    router.push(`/library/${bookId}/read`)
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Navigation */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80">
            <BookOpen className="h-6 w-6 text-slate-900" />
            <span className="text-xl font-bold text-slate-900">BookVault</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600 hidden sm:inline">{user?.email}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8">
          <span>←</span>
          <span>Back to Dashboard</span>
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">My Wishlist</h1>
          <p className="text-slate-600">
            Books you want to read. Save them here and start reading when available!
          </p>
        </div>

        {fetchError && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{fetchError}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-slate-600">Loading wishlist...</p>
          </div>
        ) : wishlist.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <Heart className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Wishlist Empty</h3>
              <p className="text-slate-600 mb-6">
                Add books to your wishlist from the library so you don&apos;t forget them!
              </p>
              <Link href="/library">
                <Button className="bg-slate-900 hover:bg-slate-800">Browse Library</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {wishlist.map((item) => (
              <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative h-48 bg-slate-200">
                  <img
                    src={(item.book as any)?.cover_url || fallbackCover}
                    alt={`${(item.book as any)?.title || 'Book'} cover`}
                    className="w-full h-full object-cover"
                    onError={(event) => {
                      event.currentTarget.src = fallbackCover
                    }}
                  />
                </div>
                <CardContent className="pt-4">
                  <h3 className="font-semibold text-slate-900 line-clamp-2 mb-1">
                    {(item.book as any)?.title}
                  </h3>
                  <p className="text-sm text-slate-600 mb-3">
                    {(item.book as any)?.author}
                  </p>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">{(item.book as any)?.category}</span>
                      <span className="font-medium text-slate-900">
                        {(item.book as any)?.available_copies} available
                      </span>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => handleRead((item.book as any)?.id)}
                        disabled={(item.book as any)?.available_copies === 0}
                        className="flex-1 h-9 bg-slate-900 hover:bg-slate-800"
                      >
                        Read
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveFromWishlist(item.id)}
                        className="h-9 px-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
