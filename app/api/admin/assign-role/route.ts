import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const adminCode = process.env.ADMIN_SIGNUP_CODE

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL.' },
        { status: 500 },
      )
    }

    if (!adminCode) {
      return NextResponse.json(
        { error: 'Admin signup code is not configured.' },
        { status: 500 },
      )
    }

    const body = await request.json().catch(() => null)
    const userId = typeof body?.userId === 'string' ? body.userId : ''
    const email = typeof body?.email === 'string' ? body.email : ''
    const code = typeof body?.code === 'string' ? body.code : ''

    if (!userId) {
      return NextResponse.json({ error: 'Missing user id.' }, { status: 400 })
    }

    if (!code) {
      return NextResponse.json({ assigned: false }, { status: 200 })
    }

    if (code !== adminCode) {
      return NextResponse.json({ error: 'Invalid admin code.' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { error } = await supabase
      .from('profiles')
      .upsert(
        {
          id: userId,
          email: email || null,
          role: 'admin',
        },
        { onConflict: 'id' },
      )

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ assigned: true })
  } catch (error) {
    console.error('Assign admin role failed:', error)
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
