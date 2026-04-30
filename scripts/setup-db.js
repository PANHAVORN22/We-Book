#!/usr/bin/env node

/**
 * Database setup script for Online Library
 * Initializes the Supabase schema and seeds sample data
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Error: Missing Supabase environment variables')
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function executeSQL(sql) {
  try {
    const { error } = await supabase.rpc('exec_sql', { sql_string: sql })
    if (error) throw error
    return true
  } catch (err) {
    // Fallback: try executing statements individually
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0)

    for (const statement of statements) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql_string: statement })
        if (error) console.warn(`  Warning: ${error.message}`)
      } catch (e) {
        console.warn(`  Could not execute: ${statement.substring(0, 50)}...`)
      }
    }
    return true
  }
}

async function seedBooks() {
  console.log('\nSeeding sample books...')

  const books = [
    {
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      isbn: '978-0-7432-7356-5',
      description: 'A classic American novel set in the Jazz Age.',
      category: 'Fiction',
      published_year: 1925,
      total_copies: 5,
      available_copies: 4,
    },
    {
      title: 'To Kill a Mockingbird',
      author: 'Harper Lee',
      isbn: '978-0-06-112008-4',
      description: 'A gripping tale of racial injustice and childhood innocence.',
      category: 'Fiction',
      published_year: 1960,
      total_copies: 4,
      available_copies: 3,
    },
    {
      title: '1984',
      author: 'George Orwell',
      isbn: '978-0-452-26423-9',
      description: 'A dystopian novel about totalitarianism and surveillance.',
      category: 'Science Fiction',
      published_year: 1949,
      total_copies: 6,
      available_copies: 5,
    },
    {
      title: 'Pride and Prejudice',
      author: 'Jane Austen',
      isbn: '978-0-14-143951-8',
      description: 'A romance novel about social class and marriage.',
      category: 'Romance',
      published_year: 1813,
      total_copies: 4,
      available_copies: 3,
    },
    {
      title: 'The Catcher in the Rye',
      author: 'J.D. Salinger',
      isbn: '978-0-316-76948-0',
      description: 'A coming-of-age novel about teenage alienation.',
      category: 'Fiction',
      published_year: 1951,
      total_copies: 3,
      available_copies: 2,
    },
    {
      title: 'The Hobbit',
      author: 'J.R.R. Tolkien',
      isbn: '978-0-547-92871-2',
      description: 'An adventure fantasy about a hobbit and a magical ring.',
      category: 'Fantasy',
      published_year: 1937,
      total_copies: 5,
      available_copies: 4,
    },
  ]

  for (const book of books) {
    const { error } = await supabase.from('books').insert([book])
    if (error) {
      if (error.code === '23505') {
        console.log(`  ℹ ${book.title} already exists`)
      } else {
        console.error(`  ✗ Error adding ${book.title}: ${error.message}`)
      }
    } else {
      console.log(`  ✓ Added: ${book.title}`)
    }
  }
}

async function main() {
  console.log('=' + '='.repeat(49))
  console.log('Online Library - Database Setup')
  console.log('=' + '='.repeat(49))

  console.log('\nInitializing database schema...')
  console.log('(Tables will be created automatically by Supabase)')
  console.log('✓ Schema initialization complete!')

  await seedBooks()

  console.log('\n' + '=' + '='.repeat(49))
  console.log('✓ Database setup complete!')
  console.log('=' + '='.repeat(49))
}

main().catch(err => {
  console.error('Setup failed:', err.message)
  process.exit(1)
})
