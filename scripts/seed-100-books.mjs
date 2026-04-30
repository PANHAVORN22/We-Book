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

function escapeXml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function wrapTitle(title, maxChars) {
  const words = title.split(' ')
  const lines = []
  let current = ''

  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (next.length <= maxChars) {
      current = next
    } else {
      if (current) lines.push(current)
      current = word
    }
  }

  if (current) lines.push(current)

  if (lines.length > 2) {
    const truncated = lines.slice(0, 2)
    if (truncated[1].length > maxChars - 3) {
      truncated[1] = truncated[1].slice(0, maxChars - 3) + '...'
    } else {
      truncated[1] += '...'
    }
    return truncated
  }

  return lines
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const adjectives = [
  'Silent',
  'Crimson',
  'Hidden',
  'Golden',
  'Bright',
  'Lost',
  'Midnight',
  'Wandering',
  'Shifting',
  'Forgotten',
  'Restless',
  'Luminous',
  'Frozen',
  'Wild',
  'Distant',
  'Arcane',
  'Secret',
  'Hollow',
  'Verdant',
  'Starlit',
]

const nouns = [
  'Harbor',
  'Valley',
  'Signal',
  'Map',
  'Garden',
  'Archive',
  'Oasis',
  'Ember',
  'Compass',
  'Tide',
  'Library',
  'Shadow',
  'Crown',
  'Voyage',
  'Lantern',
  'Cipher',
  'Horizon',
  'Riddle',
  'Mirror',
  'Sanctum',
]

const places = [
  'North',
  'South',
  'West',
  'East',
  'Stone',
  'Glass',
  'Ivory',
  'Amber',
  'Iron',
  'Silver',
  'Azure',
  'Crimson',
  'Verdant',
  'Aurora',
  'Ember',
]

const firstNames = [
  'Avery',
  'Jordan',
  'Morgan',
  'Cameron',
  'Riley',
  'Quinn',
  'Peyton',
  'Rowan',
  'Sawyer',
  'Emerson',
  'Harper',
  'Parker',
  'Blake',
  'Sydney',
  'Finley',
  'Marin',
  'Kai',
  'Reese',
  'Sage',
  'Taylor',
]

const lastNames = [
  'Reed',
  'Hayes',
  'Patel',
  'Nguyen',
  'Collins',
  'Brooks',
  'Quinn',
  'Lawson',
  'Bennett',
  'Foster',
  'Morgan',
  'Wells',
  'Price',
  'Adler',
  'Hart',
  'Santos',
  'Lin',
  'Rhodes',
  'Monroe',
  'Carter',
]

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

const palettes = [
  ['#1b1f3b', '#2f6b8f', '#f4d35e'],
  ['#2d1b3b', '#7c3aed', '#f472b6'],
  ['#0f172a', '#1e293b', '#38bdf8'],
  ['#1f2937', '#6b7280', '#f59e0b'],
  ['#052e16', '#166534', '#a7f3d0'],
  ['#3f1d1d', '#7f1d1d', '#fca5a5'],
  ['#111827', '#374151', '#eab308'],
  ['#0c4a6e', '#0369a1', '#e0f2fe'],
]

function buildTitle() {
  const style = randomInt(1, 4)
  const adj = adjectives[randomInt(0, adjectives.length - 1)]
  const noun = nouns[randomInt(0, nouns.length - 1)]
  const place = places[randomInt(0, places.length - 1)]

  if (style === 1) return `The ${adj} ${noun}`
  if (style === 2) return `${noun} of ${place}`
  if (style === 3) return `${adj} ${noun}`
  return `${noun} of the ${adj} ${place}`
}

function buildAuthor() {
  const first = firstNames[randomInt(0, firstNames.length - 1)]
  const last = lastNames[randomInt(0, lastNames.length - 1)]
  return `${first} ${last}`
}

function buildDescription(title, category) {
  const focus = nouns[randomInt(0, nouns.length - 1)].toLowerCase()
  return `A ${category.toLowerCase()} story about the ${focus} behind ${title.toLowerCase()}.`
}

function writeCover({ index, title, author }) {
  const [c1, c2, c3] = palettes[randomInt(0, palettes.length - 1)]
  const lines = wrapTitle(title, 18)
  const coverName = `auto-${String(index).padStart(3, '0')}.svg`
  const coverPath = path.join(COVERS_DIR, coverName)

  const titleLine1 = escapeXml(lines[0] || '')
  const titleLine2 = escapeXml(lines[1] || '')
  const authorLine = escapeXml(author)

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="300" height="450" viewBox="0 0 300 450" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${titleLine1}">
  <defs>
    <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}" />
      <stop offset="55%" stop-color="${c2}" />
      <stop offset="100%" stop-color="${c3}" />
    </linearGradient>
  </defs>
  <rect width="300" height="450" fill="url(#grad)" />
  <circle cx="60" cy="70" r="26" fill="rgba(255,255,255,0.25)" />
  <rect x="210" y="40" width="60" height="120" rx="12" fill="rgba(255,255,255,0.18)" />
  <rect x="24" y="260" width="252" height="2" fill="rgba(255,255,255,0.3)" />
  <text x="24" y="120" fill="#ffffff" font-size="24" font-family="Georgia, serif" font-weight="700">
    ${titleLine1}
  </text>
  ${titleLine2 ? `<text x="24" y="150" fill="#ffffff" font-size="20" font-family="Georgia, serif" font-weight="600">${titleLine2}</text>` : ''}
  <text x="24" y="410" fill="#ffffff" font-size="14" font-family="Georgia, serif" letter-spacing="1">
    ${authorLine}
  </text>
</svg>
`

  fs.writeFileSync(coverPath, svg, 'utf8')
  return `/covers/${coverName}`
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
  const usedTitles = new Set()

  let index = 1
  while (books.length < 100) {
    const title = buildTitle()
    if (usedTitles.has(title)) continue
    usedTitles.add(title)

    const author = buildAuthor()
    const category = categories[randomInt(0, categories.length - 1)]
    const totalCopies = randomInt(1, 8)
    const availableCopies = randomInt(0, totalCopies)
    const publishedYear = randomInt(1980, 2025)
    const coverUrl = writeCover({ index, title, author })

    books.push({
      title,
      author,
      description: buildDescription(title, category),
      category,
      published_year: publishedYear,
      total_copies: totalCopies,
      available_copies: availableCopies,
      cover_url: coverUrl,
    })

    index += 1
  }

  console.log(`Generated ${books.length} books and cover images.`)

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

  console.log('Done! 100 books added.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
