'use client'

import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { mockAdminUser, mockBooks, mockReadingRecords } from '@/lib/mock-data'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { BookOpen, LogOut, Plus, Trash2, Edit2, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface Book {
  id: string
  title: string
  author: string
  isbn: string
  description: string
  cover_url: string
  category: string
  published_year: number
  total_copies: number
  available_copies: number
}

interface BorrowRecord {
  id: string
  book_id: string
  user_id: string
  borrow_date: string
  due_date: string
  return_date: string | null
  status: 'borrowed' | 'returned' | 'overdue'
  book: {
    title: string
    author: string
  } | null
  user: {
    full_name: string | null
    email: string | null
  } | null
}

export default function AdminPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [borrows, setBorrows] = useState<BorrowRecord[]>([])
  const [borrowsLoading, setBorrowsLoading] = useState(true)
  const [borrowsError, setBorrowsError] = useState('')
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    description: '',
    cover_url: '',
    category: 'Fiction',
    published_year: new Date().getFullYear(),
    total_copies: 1,
  })

  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const mockMode = searchParams.get('mock') === '1'

  const categories = [
    'Fiction',
    'Science Fiction',
    'Mystery',
    'Romance',
    'Fantasy',
    'Biography',
    'History',
    'Self-Help',
    'Other',
  ]

  useEffect(() => {
    if (mockMode) {
      setUser(mockAdminUser)
      setIsAdmin(true)
      setLoading(false)
      return
    }

    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      setUser(user)

      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') {
        router.push('/dashboard')
        return
      }

      setIsAdmin(true)
    }

    checkAuth()
  }, [mockMode, supabase, router])

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const { data, error } = await supabase.from('books').select('*').order('title')

        if (error) throw error

        setBooks(data || [])
      } catch (error) {
        console.error('Error fetching books:', error)
      } finally {
        setLoading(false)
      }
    }

    if (mockMode) {
      setBooks(mockBooks)
      setLoading(false)
      return
    }

    if (isAdmin) {
      fetchBooks()
    }
  }, [isAdmin, mockMode, supabase])

  useEffect(() => {
    const fetchBorrows = async () => {
      setBorrowsError('')

      if (mockMode) {
        setBorrows(mockReadingRecords as BorrowRecord[])
        setBorrowsLoading(false)
        return
      }

      if (!isAdmin) return

      setBorrowsLoading(true)

      try {
        const { data, error } = await supabase
          .from('book_borrows')
          .select(
            `
            id,
            book_id,
            user_id,
            borrow_date,
            due_date,
            return_date,
            status,
            book:book_id (title, author),
            user:user_id (full_name, email)
          `
          )
          .order('borrow_date', { ascending: false })

        if (error) throw error

        setBorrows((data as BorrowRecord[]) || [])
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to load reading records.'
        setBorrowsError(message)
        setBorrows([])
      } finally {
        setBorrowsLoading(false)
      }
    }

    fetchBorrows()
  }, [isAdmin, mockMode, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (mockMode) {
      if (editingId) {
        setBooks((prevBooks) =>
          prevBooks.map((book) =>
            book.id === editingId
              ? {
                  ...book,
                  ...formData,
                  available_copies: Math.min(book.available_copies, formData.total_copies),
                }
              : book
          )
        )
        alert('Mock mode: book updated successfully!')
      } else {
        const id =
          typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `mock-${Date.now()}`

        setBooks((prevBooks) => [
          {
            id,
            ...formData,
            available_copies: formData.total_copies,
          },
          ...prevBooks,
        ])
        alert('Mock mode: book added successfully!')
      }

      setFormData({
        title: '',
        author: '',
        isbn: '',
        description: '',
        cover_url: '',
        category: 'Fiction',
        published_year: new Date().getFullYear(),
        total_copies: 1,
      })
      setEditingId(null)
      setShowForm(false)
      return
    }

    try {
      if (editingId) {
        // Update book
        const { error } = await supabase
          .from('books')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingId)

        if (error) throw error

        alert('Book updated successfully!')
      } else {
        // Add new book
        const { error } = await supabase.from('books').insert([
          {
            ...formData,
            available_copies: formData.total_copies,
          },
        ])

        if (error) throw error

        alert('Book added successfully!')
      }

      // Refresh books
      const { data } = await supabase.from('books').select('*').order('title')
      setBooks(data || [])

      // Reset form
      setFormData({
        title: '',
        author: '',
        isbn: '',
        description: '',
        cover_url: '',
        category: 'Fiction',
        published_year: new Date().getFullYear(),
        total_copies: 1,
      })
      setEditingId(null)
      setShowForm(false)
    } catch (error: any) {
      alert('Error saving book: ' + error.message)
    }
  }

  const handleEdit = (book: Book) => {
    setFormData({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      description: book.description,
      cover_url: book.cover_url,
      category: book.category,
      published_year: book.published_year,
      total_copies: book.total_copies,
    })
    setEditingId(book.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this book?')) return

    if (mockMode) {
      setBooks((prevBooks) => prevBooks.filter((book) => book.id !== id))
      alert('Mock mode: book deleted successfully!')
      return
    }

    try {
      const { error } = await supabase.from('books').delete().eq('id', id)

      if (error) throw error

      setBooks(books.filter((book) => book.id !== id))
      alert('Book deleted successfully!')
    } catch (error: any) {
      alert('Error deleting book: ' + error.message)
    }
  }

  const handleLogout = async () => {
    if (mockMode) {
      router.push('/auth/login')
      return
    }

    try {
      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleReturnBorrow = async (borrowId: string) => {
    const returnDate = new Date().toISOString()

    if (mockMode) {
      setBorrows((prevBorrows) =>
        prevBorrows.map((borrow) =>
          borrow.id === borrowId
            ? {
                ...borrow,
                status: 'returned',
                return_date: returnDate,
              }
            : borrow
        )
      )
      alert('Mock mode: reading marked as finished.')
      return
    }

    try {
      const { error } = await supabase
        .from('book_borrows')
        .update({
          status: 'returned',
          return_date: returnDate,
        })
        .eq('id', borrowId)

      if (error) throw error

      setBorrows((prevBorrows) =>
        prevBorrows.map((borrow) =>
          borrow.id === borrowId
            ? { ...borrow, status: 'returned', return_date: returnDate }
            : borrow
        )
      )
      alert('Reading marked as finished.')
    } catch (error: any) {
      alert('Error updating borrow: ' + error.message)
    }
  }

  const handleExtendBorrow = async (borrowId: string, days = 7) => {
    const borrow = borrows.find((record) => record.id === borrowId)
    if (!borrow) return

    const currentDue = new Date(borrow.due_date)
    currentDue.setDate(currentDue.getDate() + days)
    const nextDueDate = currentDue.toISOString()

    if (mockMode) {
      setBorrows((prevBorrows) =>
        prevBorrows.map((record) =>
          record.id === borrowId
            ? {
                ...record,
                due_date: nextDueDate,
                status: record.status === 'overdue' ? 'borrowed' : record.status,
              }
            : record
        )
      )
      alert('Mock mode: due date extended.')
      return
    }

    try {
      const { error } = await supabase
        .from('book_borrows')
        .update({
          due_date: nextDueDate,
          status: borrow.status === 'overdue' ? 'borrowed' : borrow.status,
        })
        .eq('id', borrowId)

      if (error) throw error

      setBorrows((prevBorrows) =>
        prevBorrows.map((record) =>
          record.id === borrowId
            ? {
                ...record,
                due_date: nextDueDate,
                status: record.status === 'overdue' ? 'borrowed' : record.status,
              }
            : record
        )
      )
      alert('Due date extended.')
    } catch (error: any) {
      alert('Error extending due date: ' + error.message)
    }
  }

  const formatDate = (dateValue: string | null) => {
    if (!dateValue) return '—'
    return new Date(dateValue).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const isOverdue = (dueDate: string, status: BorrowRecord['status']) => {
    return status === 'borrowed' && new Date(dueDate) < new Date()
  }

  const getStatusIcon = (status: BorrowRecord['status'], overdue: boolean) => {
    if (overdue || status === 'overdue') {
      return <AlertCircle className="h-4 w-4 text-red-600" />
    }
    if (status === 'returned') {
      return <CheckCircle2 className="h-4 w-4 text-green-600" />
    }
    return <Clock className="h-4 w-4 text-blue-600" />
  }

  const getStatusLabel = (status: BorrowRecord['status'], overdue: boolean) => {
    if (overdue || status === 'overdue') return 'Overdue'
    if (status === 'returned') return 'Returned'
    return 'Reading'
  }

  if (!isAdmin && !mockMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <p className="text-slate-600">Checking permissions...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Navigation */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80">
            <BookOpen className="h-6 w-6 text-slate-900" />
            <span className="text-xl font-bold text-slate-900">BookVault Admin</span>
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
        {mockMode && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Mock mode is enabled. Changes are stored only in memory.
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Book Management</h1>
            <p className="text-slate-600">Add, edit, and manage books in the library</p>
          </div>
          <Button
            onClick={() => {
              setShowForm(!showForm)
              setEditingId(null)
              if (showForm) {
                setFormData({
                  title: '',
                  author: '',
                  isbn: '',
                  description: '',
                  cover_url: '',
                  category: 'Fiction',
                  published_year: new Date().getFullYear(),
                  total_copies: 1,
                })
              }
            }}
            className="bg-slate-900 hover:bg-slate-800 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {showForm ? 'Cancel' : 'Add Book'}
          </Button>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{editingId ? 'Edit Book' : 'Add New Book'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Title *
                    </label>
                    <Input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Book title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Author *
                    </label>
                    <Input
                      type="text"
                      required
                      value={formData.author}
                      onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                      placeholder="Author name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      ISBN
                    </label>
                    <Input
                      type="text"
                      value={formData.isbn}
                      onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                      placeholder="ISBN"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Published Year
                    </label>
                    <Input
                      type="number"
                      value={formData.published_year}
                      onChange={(e) =>
                        setFormData({ ...formData, published_year: parseInt(e.target.value) })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Total Copies
                    </label>
                    <Input
                      type="number"
                      required
                      min="1"
                      value={formData.total_copies}
                      onChange={(e) =>
                        setFormData({ ...formData, total_copies: parseInt(e.target.value) })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Cover URL
                  </label>
                  <Input
                    type="url"
                    value={formData.cover_url}
                    onChange={(e) => setFormData({ ...formData, cover_url: e.target.value })}
                    placeholder="https://example.com/cover.jpg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Description
                  </label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Book description"
                    className="min-h-24"
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="bg-slate-900 hover:bg-slate-800">
                    {editingId ? 'Update Book' : 'Add Book'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false)
                      setEditingId(null)
                      setFormData({
                        title: '',
                        author: '',
                        isbn: '',
                        description: '',
                        cover_url: '',
                        category: 'Fiction',
                        published_year: new Date().getFullYear(),
                        total_copies: 1,
                      })
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Books List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-slate-600">Loading books...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {books.map((book) => (
              <Card key={book.id}>
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 text-lg">{book.title}</h3>
                      <p className="text-sm text-slate-600 mb-2">by {book.author}</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                        <div>
                          <p className="text-slate-600">Category</p>
                          <p className="font-medium text-slate-900">{book.category}</p>
                        </div>
                        <div>
                          <p className="text-slate-600">Published</p>
                          <p className="font-medium text-slate-900">{book.published_year}</p>
                        </div>
                        <div>
                          <p className="text-slate-600">Total Copies</p>
                          <p className="font-medium text-slate-900">{book.total_copies}</p>
                        </div>
                        <div>
                          <p className="text-slate-600">Available</p>
                          <p className="font-medium text-slate-900">{book.available_copies}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(book)}
                        className="flex items-center gap-1"
                      >
                        <Edit2 className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(book.id)}
                        className="flex items-center gap-1"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Borrowed Books */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Reading Activity</h2>
              <p className="text-slate-600">Track who is reading each book and their progress.</p>
            </div>
          </div>

          {borrowsError && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {borrowsError}
            </div>
          )}

          {borrowsLoading ? (
            <div className="text-center py-8">
              <p className="text-slate-600">Loading reading records...</p>
            </div>
          ) : borrows.length === 0 ? (
            <Card>
              <CardContent className="pt-8 pb-8 text-center">
                <BookOpen className="h-10 w-10 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600">No reading records yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {borrows.map((borrow) => {
                const overdue = isOverdue(borrow.due_date, borrow.status)
                const borrowerName =
                  borrow.user?.full_name || borrow.user?.email || 'Unknown borrower'
                const borrowerEmail = borrow.user?.email || 'Unknown email'

                return (
                  <Card key={borrow.id}>
                    <CardContent className="pt-6">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getStatusIcon(borrow.status, overdue)}
                            <h3 className="font-semibold text-slate-900">
                              {borrow.book?.title || 'Unknown Book'}
                            </h3>
                          </div>
                          <p className="text-sm text-slate-600 mb-3">
                            by {borrow.book?.author || 'Unknown Author'}
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                            <div>
                              <p className="text-slate-500">Reader</p>
                              <p className="font-medium text-slate-900">{borrowerName}</p>
                              <p className="text-xs text-slate-500">{borrowerEmail}</p>
                            </div>
                            <div>
                              <p className="text-slate-500">Started</p>
                              <p className="font-medium text-slate-900">
                                {formatDate(borrow.borrow_date)}
                              </p>
                            </div>
                            <div>
                              <p className={overdue ? 'text-red-600 font-medium' : 'text-slate-500'}>
                                Due Date
                              </p>
                              <p className={overdue ? 'font-semibold text-red-600' : 'font-medium text-slate-900'}>
                                {formatDate(borrow.due_date)}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-500">Status</p>
                              <p className="font-medium text-slate-900">
                                {getStatusLabel(borrow.status, overdue)}
                              </p>
                              <p className="text-xs text-slate-500">
                                Returned: {formatDate(borrow.return_date)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={borrow.status === 'returned'}
                            onClick={() => handleExtendBorrow(borrow.id)}
                          >
                            Extend 7 days
                          </Button>
                          <Button
                            size="sm"
                            disabled={borrow.status !== 'borrowed'}
                            onClick={() => handleReturnBorrow(borrow.id)}
                          >
                            Mark Returned
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
