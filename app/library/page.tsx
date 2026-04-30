'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertCircle, BookOpen, Search, LogOut, Heart } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from '@/hooks/use-toast'

interface Book {
  id: string
  title: string
  author: string
  description: string
  cover_url: string
  category: string
  published_year: number
  available_copies: number
  total_copies: number
}

export default function LibraryPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [user, setUser] = useState<any>(null)
  const [wishlistIds, setWishlistIds] = useState<string[]>([])
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const fallbackCover = '/covers/cover-placeholder.svg'

  const categories = ['all', 'Fiction', 'Science Fiction', 'Romance', 'Mystery', 'Fantasy']

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
    if (!user) return

    const fetchBooks = async () => {
      setFetchError('')

      try {
        const { data, error } = await supabase.from('books').select('*').order('title')

        if (error) {
          setFetchError(error.message || 'Unable to load books right now.')
          setBooks([])
          setFilteredBooks([])
          return
        }

        setBooks(data || [])
        setFilteredBooks(data || [])
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to load books right now.'
        setFetchError(message)
        setBooks([])
        setFilteredBooks([])
      } finally {
        setLoading(false)
      }
    }

    fetchBooks()
  }, [supabase, user])

  useEffect(() => {
    const fetchWishlist = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from('wishlist')
          .select('book_id')
          .eq('user_id', user.id)

        if (error) {
          console.error('Error fetching wishlist:', error)
          return
        }

        setWishlistIds((data || []).map((item) => item.book_id))
      } catch (error) {
        console.error('Error fetching wishlist:', error)
      }
    }

    fetchWishlist()
  }, [supabase, user])

  useEffect(() => {
    let filtered = books

    if (search) {
      filtered = filtered.filter(
        (book) =>
          book.title.toLowerCase().includes(search.toLowerCase()) ||
          book.author.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((book) => book.category === selectedCategory)
    }

    setFilteredBooks(filtered)
  }, [search, selectedCategory, books])

  const handleBorrow = async (bookId: string) => {
    if (!user?.id) {
      toast({
        title: 'Please sign in',
        description: 'You need to be signed in to start reading.',
        variant: 'destructive',
      })
      router.push('/auth/login')
      return
    }

    try {
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 14)

      // Record the reading session (ignore duplicate errors)
      await supabase.from('book_borrows').insert([
        {
          user_id: user.id,
          book_id: bookId,
          due_date: dueDate.toISOString(),
        },
      ])
    } catch {
      // Ignore – we still want to open the reader
    }

    // Navigate to the reader
    router.push(`/library/${bookId}/read`)
  }

  const handleToggleWishlist = async (bookId: string) => {
    if (!user) return

    const isInWishlist = wishlistIds.includes(bookId)

    try {
      if (isInWishlist) {
        const { error } = await supabase
          .from('wishlist')
          .delete()
          .eq('user_id', user.id)
          .eq('book_id', bookId)

        if (error) throw error

        setWishlistIds((prev) => prev.filter((id) => id !== bookId))
      } else {
        const { error } = await supabase.from('wishlist').insert([
          {
            user_id: user.id,
            book_id: bookId,
          },
        ])

        if (error) throw error

        setWishlistIds((prev) => [...prev, bookId])
      }
    } catch (error: any) {
      alert('Error updating wishlist: ' + error.message)
    }
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
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-70 transition-opacity">
            <div className="bg-primary p-2 rounded-lg">
              <BookOpen className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">BookVault</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-foreground/60 hidden sm:inline font-medium">{user?.email}</span>
            <Link href="/dashboard/wishlist">
              <Button variant="ghost" size="sm" className="text-foreground hover:bg-secondary">
                <Heart className="h-5 w-5" />
              </Button>
            </Link>
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
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-foreground mb-3">Library</h1>
          <p className="text-lg text-foreground/60 mb-8">
            Browse our collection of {books.length} books and find your next favorite read.
          </p>

          {fetchError && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{fetchError}</AlertDescription>
            </Alert>
          )}

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/40" />
              <Input
                type="text"
                placeholder="Search by title or author..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-10"
              />
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48 h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Books Grid */}
        {loading ? (
          <div className="text-center py-16">
            <p className="text-foreground/60 font-medium">Loading books...</p>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="h-12 w-12 text-foreground/30 mx-auto mb-4" />
            <p className="text-foreground/60 font-medium">No books found. Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredBooks.map((book) => {
              const inWishlist = wishlistIds.includes(book.id)

              return (
                <Card key={book.id} className="overflow-hidden border border-border hover:shadow-md transition-shadow h-full flex flex-col">
                  <Link href={`/library/${book.id}`} className="block">
                    <div className="relative h-48 bg-secondary overflow-hidden">
                      <img
                        src={book.cover_url || fallbackCover}
                        alt={`${book.title} cover`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        onError={(event) => {
                          event.currentTarget.src = fallbackCover
                        }}
                      />
                      {book.available_copies === 0 && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="text-white font-semibold">Not Available</span>
                        </div>
                      )}
                    </div>
                  </Link>
                  <CardContent className="pt-4 flex-1 flex flex-col">
                    <Link href={`/library/${book.id}`} className="block hover:text-primary transition-colors">
                      <h3 className="font-semibold text-foreground line-clamp-2 mb-1 text-sm">
                        {book.title}
                      </h3>
                    </Link>
                    <p className="text-xs text-foreground/60 mb-3">{book.author}</p>

                    <div className="space-y-2 mb-4 flex-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="bg-secondary text-foreground px-2 py-1 rounded font-medium">
                          {book.category}
                        </span>
                        <span className="font-semibold text-foreground">{book.published_year}</span>
                      </div>

                      <div className="bg-secondary border border-border rounded px-2 py-1">
                        <p className="text-xs text-foreground/70 font-medium">
                          {book.available_copies} of {book.total_copies} available
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => handleBorrow(book.id)}
                        disabled={book.available_copies === 0}
                        className="flex-1 h-8 bg-primary text-primary-foreground font-semibold hover:bg-primary/90 text-xs disabled:opacity-50"
                      >
                        Read
                      </Button>
                      <Button
                        size="sm"
                        variant={inWishlist ? 'default' : 'outline'}
                        onClick={() => handleToggleWishlist(book.id)}
                        className="h-8 px-2"
                      >
                        <Heart className={`h-4 w-4 ${inWishlist ? 'fill-current' : ''}`} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
