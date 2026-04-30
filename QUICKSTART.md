# BookVault - Quick Start (5 Minutes)

## What You'll Build

A full-stack online library with:
- OTP email authentication (no passwords!)
- Browse & search thousands of books
- Borrow books with due dates
- Wishlists & book ratings
- Admin dashboard
- Real-time borrowing status

## 30-Second Setup

### 1. Get Supabase Keys (2 min)

1. Go to [supabase.com](https://supabase.com) → Sign up (free)
2. Create a new project
3. Wait for it to initialize
4. Go to **Settings > API** (gear icon in sidebar)
5. Copy these values:
   ```
   NEXT_PUBLIC_SUPABASE_URL    → URL field
   NEXT_PUBLIC_SUPABASE_ANON_KEY → anon key
   SUPABASE_SERVICE_ROLE_KEY    → service_role key (keep secret!)
   ```

### 2. Configure Environment (1 min)

Create `.env.local` in project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/auth/callback
```

### 3. Setup Database (1 min)

1. In Supabase Dashboard, click **SQL Editor** (left sidebar)
2. Click **+ New Query**
3. Copy & paste entire content from `scripts/001_create_library_schema.sql`
4. Click **Run**

Done! Database is ready.

### 4. Add Sample Books (30 sec)

```bash
cd scripts
node setup-db.js
```

### 5. Start App (1 min)

```bash
pnpm dev
```

Visit: **http://localhost:3000**

## Try It Out

### User Path
1. Click "Get Started"
2. Enter your email
3. Check email for OTP code (or check Supabase logs)
4. Enter 6-digit code
5. Browse books & borrow!

### Admin Path
1. Sign up with an email
2. Go to Supabase → **SQL Editor**
3. Run this (replace USER_ID with your ID from auth.users):
   ```sql
   UPDATE public.profiles SET role = 'admin' WHERE id = 'USER_ID';
   ```
4. Go to `/admin` to add/manage books

## Common Issues

**"No email received"**
- Check spam folder
- Check Supabase Auth logs (Dashboard > Auth > Logs)

**"Environment variables not found"**
- Make sure `.env.local` exists
- Restart dev server after adding env vars
- Check you copied full values

**"Database error"**
- Verify SQL schema ran without errors
- Check Supabase SQL Editor for error messages

## What's Next?

See [SETUP.md](./SETUP.md) for:
- Full feature documentation
- Detailed architecture
- Deployment instructions
- Learning resources

## Project Structure (High Level)

```
app/
├── page.tsx              ← Landing page
├── auth/                 ← Login/signup with OTP
├── dashboard/            ← User dashboard & history
├── library/              ← Browse & search books
└── admin/                ← Manage books (admin only)

Database Tables
├── profiles              ← User info
├── books                 ← Book catalog  
├── book_borrows          ← Borrow history
├── wishlist              ← Saved books
└── book_reviews          ← Ratings
```

## Tech Stack

- **Frontend**: Next.js 16 + React 19
- **Backend**: Supabase (PostgreSQL)
- **Auth**: Email OTP
- **UI**: Tailwind CSS + shadcn/ui

## Features Included

✅ Passwordless OTP authentication
✅ Browse & search 6+ books
✅ Borrow system (14-day loan)
✅ Wishlist management
✅ Ratings & reviews
✅ Borrowing history
✅ Admin book management
✅ Mobile responsive
✅ Row-level security (RLS)
✅ Automatic user profiles

## Need Help?

1. Check [SETUP.md](./SETUP.md) for detailed guide
2. Review [Supabase Docs](https://supabase.com/docs)
3. Check app logs: Browser DevTools > Console
4. Check server logs: Terminal where you ran `pnpm dev`

## What You'll Learn

This is a complete full-stack learning project covering:
- React Server Components
- Supabase integration
- Database design & RLS
- Authentication patterns
- Form handling
- Real-time data
- Responsive design

Enjoy! 📚
