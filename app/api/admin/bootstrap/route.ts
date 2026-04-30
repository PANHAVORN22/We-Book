import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL.' },
        { status: 500 },
      )
    }

    if (!adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: 'Admin credentials are not configured.' },
        { status: 400 },
      )
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data: userList, error: listError } =
      await supabase.auth.admin.listUsers({ page: 1, perPage: 200 })

    if (listError) {
      return NextResponse.json({ error: listError.message }, { status: 500 })
    }

    const existingUser = (userList?.users ?? []).find(
      (user) => user.email?.toLowerCase() === adminEmail.toLowerCase(),
    )

    let userId = existingUser?.id ?? null

    if (!userId) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
      })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      userId = data.user?.id ?? null
    } else {
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        password: adminPassword,
        email_confirm: true,
      })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Failed to resolve admin user id.' },
        { status: 500 },
      )
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: userId,
          email: adminEmail,
          role: 'admin',
        },
        { onConflict: 'id' },
      )

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Admin bootstrap failed:', error)
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
