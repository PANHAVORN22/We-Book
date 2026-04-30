'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  BookOpen,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Settings,
  X,
  Sun,
  Moon,
  Type,
  Minus,
  Plus,
} from 'lucide-react'
import Link from 'next/link'

interface Book {
  id: string
  title: string
  author: string
  description: string
  cover_url: string
  category: string
}

type ThemeMode = 'light' | 'sepia' | 'dark'

const THEME_STYLES: Record<ThemeMode, { bg: string; text: string; mutedText: string; accent: string; panel: string; border: string }> = {
  light: {
    bg: '#ffffff',
    text: '#1a1a2e',
    mutedText: '#64748b',
    accent: '#3b1f7e',
    panel: '#f8fafc',
    border: '#e2e8f0',
  },
  sepia: {
    bg: '#f5f0e8',
    text: '#3d2e1f',
    mutedText: '#7a6b5d',
    accent: '#8b6914',
    panel: '#ece5d8',
    border: '#d4c9b8',
  },
  dark: {
    bg: '#121218',
    text: '#e0e0e8',
    mutedText: '#8888a0',
    accent: '#a78bfa',
    panel: '#1c1c28',
    border: '#2a2a3a',
  },
}

const PARAGRAPHS_PER_PAGE = 8

export default function ReadBookPage() {
  const params = useParams()
  const bookId = params.id as string
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [book, setBook] = useState<Book | null>(null)
  const [paragraphs, setParagraphs] = useState<string[]>([])
  const [contentSource, setContentSource] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(0)

  // Reader settings
  const [fontSize, setFontSize] = useState(18)
  const [theme, setTheme] = useState<ThemeMode>('light')
  const [showSettings, setShowSettings] = useState(false)
  const [showHeader, setShowHeader] = useState(true)

  const themeStyle = THEME_STYLES[theme]

  // Total pages
  const totalPages = Math.ceil(paragraphs.length / PARAGRAPHS_PER_PAGE)
  const currentParagraphs = paragraphs.slice(
    currentPage * PARAGRAPHS_PER_PAGE,
    (currentPage + 1) * PARAGRAPHS_PER_PAGE
  )
  const progressPercent = totalPages > 0 ? Math.round(((currentPage + 1) / totalPages) * 100) : 0

  // Auth check
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
      }
    }
    getUser()
  }, [supabase, router])

  // Fetch book metadata
  useEffect(() => {
    const fetchBook = async () => {
      try {
        const { data, error } = await supabase
          .from('books')
          .select('id, title, author, description, cover_url, category')
          .eq('id', bookId)
          .single()

        if (error) throw error
        setBook(data)
      } catch (err) {
        console.error('Error fetching book:', err)
        setError('Book not found')
      }
    }
    fetchBook()
  }, [bookId, supabase])

  // Fetch book content from our API
  useEffect(() => {
    if (!book) return

    const fetchContent = async () => {
      setLoading(true)
      setError('')

      try {
        const res = await fetch(
          `/api/book-content?title=${encodeURIComponent(book.title)}&author=${encodeURIComponent(book.author)}`
        )

        if (!res.ok) throw new Error('Failed to fetch content')

        const data = await res.json()

        setParagraphs(data.paragraphs || [])
        setContentSource(data.source)
      } catch (err) {
        console.error('Error fetching content:', err)
        setError('Unable to load book content. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchContent()
  }, [book])

  // Keyboard navigation
  const goNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1))
  }, [totalPages])

  const goPrevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 0))
  }, [])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault()
        goNextPage()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goPrevPage()
      } else if (e.key === 'Escape') {
        setShowSettings(false)
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [goNextPage, goPrevPage])

  // Auto-hide header after inactivity
  useEffect(() => {
    let timeout: NodeJS.Timeout
    const handleMove = () => {
      setShowHeader(true)
      clearTimeout(timeout)
      timeout = setTimeout(() => setShowHeader(false), 3000)
    }

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('touchstart', handleMove)
    timeout = setTimeout(() => setShowHeader(false), 5000)

    return () => {
      clearTimeout(timeout)
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('touchstart', handleMove)
    }
  }, [])

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentPage])

  // ----- Loading / Error states -----
  if (error && !book) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: themeStyle.bg }}>
        <div className="text-center">
          <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-40" style={{ color: themeStyle.text }} />
          <p style={{ color: themeStyle.mutedText }}>{error}</p>
          <Link href="/library">
            <Button variant="outline" className="mt-4">
              Back to Library
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  if (!book) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: themeStyle.bg }}>
        <div className="flex items-center gap-3" style={{ color: themeStyle.mutedText }}>
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Loading book…
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{ background: themeStyle.bg, color: themeStyle.text }}
    >
      {/* ── Top Bar ── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: themeStyle.panel,
          borderBottom: `1px solid ${themeStyle.border}`,
          opacity: showHeader ? 1 : 0,
          pointerEvents: showHeader ? 'auto' : 'none',
          transform: showHeader ? 'translateY(0)' : 'translateY(-100%)',
        }}
      >
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => router.push(`/library/${bookId}`)}
            className="flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-70"
            style={{ color: themeStyle.mutedText }}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Book</span>
          </button>

          <div className="text-center flex-1 px-4 min-w-0">
            <p
              className="text-sm font-semibold truncate"
              style={{ color: themeStyle.text }}
            >
              {book.title}
            </p>
            <p
              className="text-xs truncate"
              style={{ color: themeStyle.mutedText }}
            >
              {book.author}
            </p>
          </div>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-lg transition-colors hover:opacity-70"
            style={{ color: themeStyle.mutedText }}
            aria-label="Reader settings"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 w-full" style={{ background: themeStyle.border }}>
          <div
            className="h-full transition-all duration-500 ease-out"
            style={{
              width: `${progressPercent}%`,
              background: themeStyle.accent,
            }}
          />
        </div>
      </header>

      {/* ── Settings Panel ── */}
      {showSettings && (
        <>
          <div
            className="fixed inset-0 z-50"
            onClick={() => setShowSettings(false)}
            style={{ background: 'rgba(0,0,0,0.3)' }}
          />
          <div
            className="fixed top-16 right-4 z-[60] w-72 rounded-xl shadow-2xl p-5 transition-all"
            style={{ background: themeStyle.panel, border: `1px solid ${themeStyle.border}` }}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold" style={{ color: themeStyle.text }}>
                Reader Settings
              </h3>
              <button onClick={() => setShowSettings(false)}>
                <X className="h-4 w-4" style={{ color: themeStyle.mutedText }} />
              </button>
            </div>

            {/* Font Size */}
            <div className="mb-5">
              <label
                className="text-xs font-medium mb-2 block"
                style={{ color: themeStyle.mutedText }}
              >
                <Type className="h-3 w-3 inline mr-1" />
                Font Size: {fontSize}px
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setFontSize((s) => Math.max(14, s - 2))}
                  className="p-2 rounded-lg transition-colors"
                  style={{ border: `1px solid ${themeStyle.border}`, color: themeStyle.text }}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: themeStyle.border }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${((fontSize - 14) / 16) * 100}%`,
                      background: themeStyle.accent,
                    }}
                  />
                </div>
                <button
                  onClick={() => setFontSize((s) => Math.min(30, s + 2))}
                  className="p-2 rounded-lg transition-colors"
                  style={{ border: `1px solid ${themeStyle.border}`, color: themeStyle.text }}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Theme */}
            <div>
              <label
                className="text-xs font-medium mb-2 block"
                style={{ color: themeStyle.mutedText }}
              >
                Theme
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'light' as ThemeMode, icon: Sun, label: 'Light' },
                  { key: 'sepia' as ThemeMode, icon: BookOpen, label: 'Sepia' },
                  { key: 'dark' as ThemeMode, icon: Moon, label: 'Dark' },
                ].map(({ key, icon: Icon, label }) => (
                  <button
                    key={key}
                    onClick={() => setTheme(key)}
                    className="flex flex-col items-center gap-1 p-3 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background: theme === key ? themeStyle.accent : 'transparent',
                      color: theme === key ? '#fff' : themeStyle.text,
                      border: `1px solid ${theme === key ? themeStyle.accent : themeStyle.border}`,
                    }}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Main Reading Area ── */}
      <main className="max-w-2xl mx-auto px-6 sm:px-8 pt-24 pb-32 min-h-screen">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div
              className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: themeStyle.accent, borderTopColor: 'transparent' }}
            />
            <p className="text-sm" style={{ color: themeStyle.mutedText }}>
              Fetching book content…
            </p>
          </div>
        ) : error ? (
          <div className="text-center py-32">
            <p style={{ color: themeStyle.mutedText }}>{error}</p>
          </div>
        ) : (
          <>
            {/* Chapter / page indicator */}
            {currentPage === 0 && (
              <div className="text-center mb-12 pt-4">
                <h1
                  className="text-3xl sm:text-4xl font-bold mb-2"
                  style={{
                    color: themeStyle.text,
                    fontFamily: "'Georgia', 'Times New Roman', serif",
                  }}
                >
                  {book.title}
                </h1>
                <p className="text-lg" style={{ color: themeStyle.mutedText }}>
                  {book.author}
                </p>
                {contentSource === 'gutenberg' && (
                  <p
                    className="text-xs mt-3 inline-block px-3 py-1 rounded-full"
                    style={{ background: themeStyle.border, color: themeStyle.mutedText }}
                  >
                    Source: Project Gutenberg (Public Domain)
                  </p>
                )}
                <div
                  className="mt-8 mx-auto w-16 h-px"
                  style={{ background: themeStyle.border }}
                />
              </div>
            )}

            {/* Paragraphs */}
            <article
              className="leading-relaxed"
              style={{
                fontSize: `${fontSize}px`,
                lineHeight: 1.85,
                fontFamily: "'Georgia', 'Times New Roman', serif",
              }}
            >
              {currentParagraphs.map((paragraph, idx) => (
                <p
                  key={`${currentPage}-${idx}`}
                  className="mb-6 animate-in fade-in duration-500"
                  style={{
                    color: themeStyle.text,
                    animationDelay: `${idx * 50}ms`,
                    animationFillMode: 'backwards',
                    textIndent: idx > 0 ? '2em' : undefined,
                  }}
                >
                  {paragraph}
                </p>
              ))}
            </article>
          </>
        )}
      </main>

      {/* ── Bottom Navigation ── */}
      {!loading && paragraphs.length > 0 && (
        <footer
          className="fixed bottom-0 left-0 right-0 z-40 transition-all duration-300"
          style={{
            background: themeStyle.panel,
            borderTop: `1px solid ${themeStyle.border}`,
            opacity: showHeader ? 1 : 0,
            pointerEvents: showHeader ? 'auto' : 'none',
            transform: showHeader ? 'translateY(0)' : 'translateY(100%)',
          }}
        >
          <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
            <button
              onClick={goPrevPage}
              disabled={currentPage === 0}
              className="flex items-center gap-1 text-sm font-medium transition-opacity disabled:opacity-30"
              style={{ color: themeStyle.accent }}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>

            <div className="text-center">
              <p className="text-xs font-medium" style={{ color: themeStyle.mutedText }}>
                Page {currentPage + 1} of {totalPages}
              </p>
              <p className="text-xs" style={{ color: themeStyle.mutedText }}>
                {progressPercent}% complete
              </p>
            </div>

            <button
              onClick={goNextPage}
              disabled={currentPage >= totalPages - 1}
              className="flex items-center gap-1 text-sm font-medium transition-opacity disabled:opacity-30"
              style={{ color: themeStyle.accent }}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </footer>
      )}
    </div>
  )
}
