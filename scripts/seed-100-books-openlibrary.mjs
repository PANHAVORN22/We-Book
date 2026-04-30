#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ROOT_DIR = path.resolve(__dirname, '..')
const ENV_PATH = path.join(ROOT_DIR, '.env.local')
const COVERS_DIR = path.join(ROOT_DIR, 'public', 'covers')

const MAX_BOOKS = 100
// Use Open Library Subjects API instead of Search API.
// Search rejects overly-generic queries (e.g. "the").
const SUBJECTS = [
  'fiction',
  'fantasy',
  'science_fiction',
  'mystery',
  'romance',
  'history',
  'biography',
  'self_help',
  'classics',
  'thriller',
]

// IMPORTANT: Cover images are often copyrighted.
// Default to using Open Library's remote cover URLs (no copying into your repo).
// If you *really* want to download, set BOOKVAULT_DOWNLOAD_COVERS=1 in your env.
const DOWNLOAD_COVERS = process.env.BOOKVAULT_DOWNLOAD_COVERS === '1'

const PAGE_LIMIT = 50
const MAX_PAGES_PER_SUBJECT = 6
const FETCH_RETRIES = 5

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return
  const content = fs.readFileSync(filePath, 'utf8')
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const eqIndex = line.indexOf('=')
    if (eqIndex === -1) continue
    const key = line.slice(0, eqIndex).trim()
    const value = line.slice(eqIndex + 1).trim()
    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

function normalizeKey(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function truncate(value, max) {
  if (!value) return value
  if (value.length <= max) return value
  return value.slice(0, max - 3).trim() + '...'
}

function mapCategory(subjects) {
  if (!subjects || subjects.length === 0) return 'Other'
  const joined = subjects.join(' ').toLowerCase()
  if (joined.includes('science fiction')) return 'Science Fiction'
  if (joined.includes('fantasy')) return 'Fantasy'
  if (joined.includes('romance')) return 'Romance'
  if (joined.includes('mystery') || joined.includes('detective') || joined.includes('crime')) return 'Mystery'
  if (joined.includes('biography') || joined.includes('autobiography')) return 'Biography'
  if (joined.includes('history') || joined.includes('historical')) return 'History'
  if (joined.includes('self-help') || joined.includes('self help') || joined.includes('psychology')) return 'Self-Help'
  return 'Fiction'
}

function pickPublishedYear(work) {
  if (work && typeof work.first_publish_year === 'number') return work.first_publish_year
  return 2000
}

function buildDescription(work) {
  const subject = Array.isArray(work.subject) && work.subject.length > 0 ? work.subject[0] : 'a favorite topic'
  return truncate(`A book about ${String(subject).toLowerCase()} from the Open Library catalog.`, 180)
}

async function fetchJson(url) {

  let lastError
  for (let attempt = 1; attempt <= FETCH_RETRIES; attempt += 1) {
    try {
      const response = await fetch(url.toString(), {
        headers: {
          'User-Agent': 'bookvault-seed-script/1.0',
          'Accept': 'application/json',
        },
      })

      if (response.ok) {
        return response.json()
      }

      const body = await response.text()
      const error = new Error(`Open Library request failed: ${response.status} ${body}`)

      // Retry on transient server errors.
      if (response.status >= 500 && attempt < FETCH_RETRIES) {
        lastError = error
      } else {
        throw error
      }
    } catch (error) {
      lastError = error
    }

    // Exponential backoff with small jitter.
    const backoffMs = Math.min(8000, 400 * 2 ** (attempt - 1)) + Math.floor(Math.random() * 250)
    await new Promise((resolve) => setTimeout(resolve, backoffMs))
  }

  throw lastError
}

function buildRemoteCoverUrl(coverId) {
  // L = large. Falls back to a default if cover is missing.
  return `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
}

async function downloadCover(coverId, index) {
  const coverUrl = `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
  const response = await fetch(coverUrl, {
    headers: {
      'User-Agent': 'bookvault-seed-script/1.0'
    }
  })

  if (!response.ok) {
    throw new Error(`Cover download failed: ${response.status}`)
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  const fileName = `openlibrary-${String(index).padStart(3, '0')}.jpg`
  const filePath = path.join(COVERS_DIR, fileName)
  fs.writeFileSync(filePath, buffer)
  return `/covers/${fileName}`
}

async function fetchSubjectWorks(subject, offset) {
  const url = new URL(`https://openlibrary.org/subjects/${subject}.json`)
  url.searchParams.set('limit', String(PAGE_LIMIT))
  url.searchParams.set('offset', String(offset))
  return fetchJson(url)
}

async function main() {
  loadEnvFile(ENV_PATH)

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
    process.exit(1)
  }

  fs.mkdirSync(COVERS_DIR, { recursive: true })

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
  const books = []
  const seen = new Set()

  let index = 1

  for (const subject of SUBJECTS) {
    if (books.length >= MAX_BOOKS) break

    for (let page = 0; page < MAX_PAGES_PER_SUBJECT; page += 1) {
      if (books.length >= MAX_BOOKS) break

      const offset = page * PAGE_LIMIT
      const data = await fetchSubjectWorks(subject, offset)
      const works = data.works || []
      if (works.length === 0) break

      for (const work of works) {
        if (books.length >= MAX_BOOKS) break
        if (!work || !work.title) continue

        const author = Array.isArray(work.authors) && work.authors[0] && work.authors[0].name
          ? work.authors[0].name
          : 'Unknown Author'

        const coverId = work.cover_id
        if (!coverId) continue

        const key = `${normalizeKey(work.title)}|${normalizeKey(author)}`
        if (seen.has(key)) continue
        seen.add(key)

        let coverUrl
        if (DOWNLOAD_COVERS) {
          try {
            coverUrl = await downloadCover(coverId, index)
          } catch {
            continue
          }
        } else {
          coverUrl = buildRemoteCoverUrl(coverId)
        }

        const subjects = Array.isArray(work.subject) ? work.subject : [subject.replace(/_/g, ' ')]

        books.push({
          title: work.title,
          author,
          description: buildDescription(work),
          category: mapCategory(subjects),
          published_year: pickPublishedYear(work),
          total_copies: 3,
          available_copies: 2,
          cover_url: coverUrl,
        })

        index += 1
      }
    }
  }

  if (books.length === 0) {
    console.error('No books were collected from Open Library.')
    process.exit(1)
  }

  console.log(`Collected ${books.length} books from Open Library subjects.`)
  console.log(`Cover mode: ${DOWNLOAD_COVERS ? 'download to public/covers/' : 'remote Open Library URLs'}`)

  const chunkSize = 20
  for (let i = 0; i < books.length; i += chunkSize) {
    const chunk = books.slice(i, i + chunkSize)
    const { error } = await supabase.from('books').insert(chunk)
    if (error) {
      console.error(`Insert failed for batch ${i + 1}-${i + chunk.length}: ${error.message}`)
      process.exit(1)
    }
    console.log(`Inserted ${i + chunk.length}/${books.length} books...`)
  }

  console.log('Done! Open Library books added.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
