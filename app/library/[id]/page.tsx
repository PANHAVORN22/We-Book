'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { BookOpen, LogOut, Heart, Star, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
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

interface Review {
  id: string
  user_id: string
  rating: number
  review_text: string
  created_at: string
  profiles: {
    email: string
  }
}

export default function BookDetailsPage() {
  const params = useParams()
  const bookId = params.id as string
  const [book, setBook] = useState<Book | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [userReview, setUserReview] = useState<Review | null>(null)
  const [loading, setLoading] = useState(true)
  const [rating, setRating] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [inWishlist, setInWishlist] = useState(false)
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
    const fetchBook = async () => {
      try {
        const { data, error } = await supabase
          .from('books')
          .select('*')
          .eq('id', bookId)
          .single()

        if (error) throw error

        setBook(data)
      } catch (error) {
        console.error('Error fetching book:', error)
        router.push('/library')
      }
    }

    fetchBook()
  }, [bookId, supabase, router])

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const { data, error } = await supabase
          .from('book_reviews')
          .select(
            `
            id,
            user_id,
            rating,
            review_text,
            created_at,
            profiles:user_id (email)
          `
          )
          .eq('book_id', bookId)
          .order('created_at', { ascending: false })

        if (error) throw error

        setReviews(data || [])

        // Check if user has a review
        if (user) {
          const userRev = data?.find((rev) => rev.user_id === user.id)
          setUserReview(userRev || null)
        }
      } catch (error) {
        console.error('Error fetching reviews:', error)
      } finally {
        setLoading(false)
      }
    }

    if (book) {
      fetchReviews()
    }
  }, [book, user, supabase])

  useEffect(() => {
    const checkWishlist = async () => {
      if (!user) return

      try {
        const { data } = await supabase
          .from('wishlist')
          .select('id')
          .eq('user_id', user.id)
          .eq('book_id', bookId)
          .single()

        setInWishlist(!!data)
      } catch (error) {
        setInWishlist(false)
      }
    }

    checkWishlist()
  }, [user, bookId, supabase])

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      if (userReview) {
        // Update existing review
        const { error } = await supabase
          .from('book_reviews')
          .update({
            rating,
            review_text: reviewText,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userReview.id)

        if (error) throw error
      } else {
        // Insert new review
        const { error } = await supabase.from('book_reviews').insert([
          {
            user_id: user.id,
            book_id: bookId,
            rating,
            review_text: reviewText,
          },
        ])

        if (error) throw error
      }

      // Refresh reviews
      const { data } = await supabase
        .from('book_reviews')
        .select(
          `
          id,
          user_id,
          rating,
          review_text,
          created_at,
          profiles:user_id (email)
        `
        )
        .eq('book_id', bookId)
        .order('created_at', { ascending: false })

      setReviews(data || [])
      const userRev = data?.find((rev) => rev.user_id === user.id)
      setUserReview(userRev || null)

      setReviewText('')
      alert('Review submitted successfully!')
    } catch (error: any) {
      alert('Error submitting review: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleStartReading = async () => {
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

      // Navigate to the reader
      router.push(`/library/${bookId}/read`)
    } catch (error: any) {
      // Even if recording fails, still open the reader
      router.push(`/library/${bookId}/read`)
    }
  }

  const handleToggleWishlist = async () => {
    try {
      if (inWishlist) {
        const { error } = await supabase
          .from('wishlist')
          .delete()
          .eq('user_id', user.id)
          .eq('book_id', bookId)

        if (error) throw error

        setInWishlist(false)
      } else {
        const { error } = await supabase.from('wishlist').insert([
          {
            user_id: user.id,
            book_id: bookId,
          },
        ])

        if (error) throw error

        setInWishlist(true)
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

  if (!book) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <p className="text-slate-600">Loading book details...</p>
      </div>
    )
  }

  const averageRating =
    reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : '0'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Navigation */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/library" className="flex items-center gap-2 hover:opacity-80">
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
        <Link
          href="/library"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Library</span>
        </Link>

        {/* Book Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Cover */}
          <div>
            <img
              src={book.cover_url || fallbackCover}
              alt={`${book.title} cover`}
              className="w-full rounded-lg shadow-lg mb-6"
              onError={(event) => {
                event.currentTarget.src = fallbackCover
              }}
            />
            <div className="space-y-3">
              <Button
                onClick={handleStartReading}
                disabled={book.available_copies === 0}
                className="w-full h-11 bg-slate-900 hover:bg-slate-800"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Start Reading
              </Button>
              <Button
                onClick={handleToggleWishlist}
                variant={inWishlist ? 'default' : 'outline'}
                className="w-full h-11"
              >
                <Heart className={`h-4 w-4 mr-2 ${inWishlist ? 'fill-current' : ''}`} />
                {inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
              </Button>
            </div>
          </div>

          {/* Details */}
          <div className="md:col-span-2">
            <div className="mb-6">
              <h1 className="text-4xl font-bold text-slate-900 mb-2">{book.title}</h1>
              <p className="text-lg text-slate-600 mb-4">by {book.author}</p>

              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.round(parseFloat(averageRating as string))
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-slate-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="font-semibold text-slate-900">{averageRating}</span>
                <span className="text-slate-600">({reviews.length} reviews)</span>
              </div>

              <div className="bg-slate-100 rounded-lg p-4 mb-6">
                <p className="text-sm text-slate-600 mb-2">Book Details</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-600">Category</p>
                    <p className="font-medium text-slate-900">{book.category}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Published</p>
                    <p className="font-medium text-slate-900">{book.published_year}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Copies Available</p>
                    <p className="font-medium text-slate-900">
                      {book.available_copies} of {book.total_copies}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600">Status</p>
                    <p
                      className={`font-medium ${
                        book.available_copies > 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {book.available_copies > 0 ? 'Available' : 'Unavailable'}
                    </p>
                  </div>
                </div>
              </div>

              {book.description && (
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 mb-2">About This Book</h2>
                  <p className="text-slate-600 leading-relaxed">{book.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="max-w-4xl">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Reviews & Ratings</h2>

          {/* Review Form */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">
                {userReview ? 'Your Review' : 'Write a Review'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Rating
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`h-6 w-6 ${
                            star <= rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="review" className="block text-sm font-medium text-slate-700 mb-2">
                    Your Review
                  </label>
                  <Textarea
                    id="review"
                    placeholder="Share your thoughts about this book..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    className="min-h-24"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submitting || !reviewText}
                  className="bg-slate-900 hover:bg-slate-800"
                >
                  {submitting ? 'Submitting...' : userReview ? 'Update Review' : 'Post Review'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Reviews List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              All Reviews ({reviews.length})
            </h3>

            {reviews.length === 0 ? (
              <Card>
                <CardContent className="pt-8 pb-8 text-center">
                  <p className="text-slate-600">No reviews yet. Be the first to review!</p>
                </CardContent>
              </Card>
            ) : (
              reviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="flex gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-slate-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="font-semibold text-slate-900">{review.rating}/5</span>
                        </div>
                        <p className="text-sm text-slate-600">
                          {(review.profiles as any)?.email}
                        </p>
                      </div>
                      <p className="text-xs text-slate-500">
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    {review.review_text && (
                      <p className="text-slate-700">{review.review_text}</p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
