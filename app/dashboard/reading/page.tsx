'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, LogOut, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ReadingRecord {
  id: string
  book_id: string
  book: {
    title: string
    author: string
  } | null
  borrow_date: string
  due_date: string
  return_date: string | null
  status: 'borrowed' | 'returned' | 'overdue'
}

export default function ReadingPage() {
  const [readings, setReadings] = useState<ReadingRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [fetchError, setFetchError] = useState('')
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

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

  const fetchReadings = useCallback(async () => {
    if (!user) return

    setLoading(true)
    setFetchError('')

    try {
      const { data: borrowData, error: borrowError } = await supabase
        .from('book_borrows')
        .select('id, book_id, borrow_date, due_date, return_date, status')
        .eq('user_id', user.id)
        .order('borrow_date', { ascending: false })

      if (borrowError) {
        setFetchError(borrowError.message || 'Unable to load reading history right now.')
        setReadings([])
        return
      }

      const uniqueBookIds = Array.from(
        new Set((borrowData || []).map((b) => b.book_id).filter(Boolean))
      )

      const booksById = new Map<string, { title: string; author: string }>()
      if (uniqueBookIds.length > 0) {
        const { data: bookData, error: bookError } = await supabase
          .from('books')
          .select('id, title, author')
          .in('id', uniqueBookIds)

        if (bookError) {
          setFetchError(bookError.message || 'Unable to load book details right now.')
        } else {
          ;(bookData || []).forEach((b) => {
            booksById.set(b.id, { title: b.title, author: b.author })
          })
        }
      }

      const merged: ReadingRecord[] = (borrowData || []).map((borrow) => ({
        ...borrow,
        book: booksById.get(borrow.book_id) ?? null,
      }))

      setReadings(merged)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load reading history right now.'
      setFetchError(message)
      setReadings([])
    } finally {
      setLoading(false)
    }
  }, [supabase, user])

  useEffect(() => {
    fetchReadings()
  }, [fetchReadings])

  useEffect(() => {
    const onFocus = () => fetchReadings()
    const onVisibility = () => {
      if (document.visibilityState === 'visible') fetchReadings()
    }

    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [fetchReadings])

  const handleFinishBook = async (readingId: string) => {
    try {
      const { error } = await supabase
        .from('book_borrows')
        .update({
          status: 'returned',
          return_date: new Date().toISOString(),
        })
        .eq('id', readingId)

      if (error) throw error

      // Refresh the list (same strategy as initial load)
      const { data: borrowData } = await supabase
        .from('book_borrows')
        .select('id, book_id, borrow_date, due_date, return_date, status')
        .eq('user_id', user.id)
        .order('borrow_date', { ascending: false })

      const uniqueBookIds = Array.from(
        new Set((borrowData || []).map((b) => b.book_id).filter(Boolean))
      )

      const booksById = new Map<string, { title: string; author: string }>()
      if (uniqueBookIds.length > 0) {
        const { data: bookData } = await supabase
          .from('books')
          .select('id, title, author')
          .in('id', uniqueBookIds)

        ;(bookData || []).forEach((b) => {
          booksById.set(b.id, { title: b.title, author: b.author })
        })
      }

      const merged: ReadingRecord[] = (borrowData || []).map((borrow) => ({
        ...borrow,
        book: booksById.get(borrow.book_id) ?? null,
      }))

      setReadings(merged)
      alert('Book marked as finished!')
    } catch (error: any) {
      alert('Error finishing book: ' + error.message)
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'returned':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case 'overdue':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      case 'borrowed':
        return <Clock className="h-5 w-5 text-blue-600" />
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const isOverdue = (dueDate: string, status: string) => {
    return new Date(dueDate) < new Date() && status !== 'returned'
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
          <h1 className="text-4xl font-bold text-slate-900 mb-2">My Reading History</h1>
          <p className="text-slate-600">
            Track your books, reading progress, and completed reads
          </p>
        </div>

        {fetchError && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{fetchError}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-slate-600">Loading reading history...</p>
          </div>
        ) : readings.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <BookOpen className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No Books Yet</h3>
              <p className="text-slate-600 mb-6">
                You haven&apos;t started reading any books yet. Visit the library to get started!
              </p>
              <Link href="/library">
                <Button className="bg-slate-900 hover:bg-slate-800">Browse Library</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Active Borrowings */}
            {readings.filter((b) => b.status !== 'returned').length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Currently Reading</h2>
                <div className="space-y-3 mb-8">
                  {readings
                    .filter((b) => b.status !== 'returned')
                    .map((borrow) => (
                      <Card
                        key={borrow.id}
                        className={isOverdue(borrow.due_date, borrow.status) ? 'border-red-200' : ''}
                      >
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {getStatusIcon(borrow.status)}
                                <h3 className="font-semibold text-slate-900">
                                  {borrow.book?.title || 'Unknown Book'}
                                </h3>
                              </div>
                              <p className="text-sm text-slate-600 mb-3">
                                by {borrow.book?.author || 'Unknown Author'}
                              </p>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                                <div>
                                  <p className="text-slate-600">Started</p>
                                  <p className="font-medium text-slate-900">
                                    {formatDate(borrow.borrow_date)}
                                  </p>
                                </div>
                                <div>
                                  <p
                                    className={
                                      isOverdue(borrow.due_date, borrow.status)
                                        ? 'text-red-600 font-medium'
                                        : 'text-slate-600'
                                    }
                                  >
                                    Due Date
                                  </p>
                                  <p
                                    className={
                                      isOverdue(borrow.due_date, borrow.status)
                                        ? 'font-bold text-red-600'
                                        : 'font-medium text-slate-900'
                                    }
                                  >
                                    {formatDate(borrow.due_date)}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <Button
                              size="sm"
                              onClick={() => handleFinishBook(borrow.id)}
                              className="ml-4 bg-slate-900 hover:bg-slate-800"
                            >
                              Finish Book
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            )}

            {/* Returned Books */}
            {readings.filter((b) => b.status === 'returned').length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Finished Books</h2>
                <div className="space-y-3">
                  {readings
                    .filter((b) => b.status === 'returned')
                    .map((borrow) => (
                      <Card key={borrow.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-3 mb-2">
                            {getStatusIcon(borrow.status)}
                            <div>
                              <h3 className="font-semibold text-slate-900">
                                {borrow.book?.title || 'Unknown Book'}
                              </h3>
                              <p className="text-sm text-slate-600">
                                by {borrow.book?.author || 'Unknown Author'}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mt-3 ml-6">
                            <div>
                              <p className="text-slate-600">Started</p>
                              <p className="font-medium text-slate-900">
                                {formatDate(borrow.borrow_date)}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-600">Finished</p>
                              <p className="font-medium text-slate-900">
                                {borrow.return_date ? formatDate(borrow.return_date) : 'N/A'}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
