# BookVault - Online Library Setup Guide

Welcome to BookVault! This is a full-stack web application for managing an online library system with user authentication, book borrowing, wishlists, and reviews.

## Technology Stack

- **Frontend**: Next.js 16 + React 19
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with OTP (One-Time Password)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Database**: PostgreSQL with Row Level Security (RLS)

## Project Structure

```
app/
├── page.tsx                          # Landing page
├── layout.tsx                        # Root layout
├── auth/
│   ├── login/page.tsx               # OTP login
│   ├── sign-up/page.tsx             # OTP sign-up
│   ├── error/page.tsx               # Auth error page
│   └── callback/route.ts            # OAuth callback
├── dashboard/
│   ├── page.tsx                     # User dashboard
│   ├── borrowing/page.tsx           # Borrowing history
│   └── wishlist/page.tsx            # Wishlist management
├── library/
│   ├── page.tsx                     # Browse & search books
│   └── [id]/page.tsx                # Book details & reviews
├── admin/
│   └── page.tsx                     # Admin book management
└── globals.css                      # Global styles

lib/
├── supabase/
│   ├── client.ts                    # Browser Supabase client
│   ├── server.ts                    # Server Supabase client
│   └── proxy.ts                     # Session management

scripts/
├── 001_create_library_schema.sql    # Database schema
└── setup-db.js                      # Seed sample data

components/
└── ui/                              # shadcn/ui components
```

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ and pnpm installed
- Supabase account (free tier works!)
- GitHub account (optional, for deployment)

### 2. Clone & Install

```bash
# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env.local
```

### 3. Setup Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In Supabase Dashboard, go to **Settings > API Keys**
3. Copy your credentials:
   - `NEXT_PUBLIC_SUPABASE_URL` - Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public Anon Key
   - `SUPABASE_SERVICE_ROLE_KEY` - Service Role Key (keep secret!)

4. Add them to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/auth/callback
```

### 4. Initialize Database

The database schema is automatically handled by Supabase, but you need to execute the SQL:

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **+ New Query**
3. Copy the entire content from `scripts/001_create_library_schema.sql`
4. Paste into the SQL editor and run

This will create:
- `profiles` table (user profiles)
- `books` table (library books)
- `book_borrows` table (borrowing records)
- `wishlist` table (user wishlists)
- `book_reviews` table (ratings & reviews)
- Automatic triggers for new user profiles

### 5. Seed Sample Data

Run the setup script to add sample books:

```bash
# This requires SUPABASE_SERVICE_ROLE_KEY to be set
cd scripts
node setup-db.js
```

Sample books added:
- The Great Gatsby
- To Kill a Mockingbird
- 1984
- Pride and Prejudice
- The Catcher in the Rye
- The Hobbit

### 6. Configure Email (OTP)

For OTP authentication to work:

1. Go to **Authentication > Providers** in Supabase
2. Enable **Email** provider
3. Under Email settings:
   - Confirm email: Yes (enable)
   - Secure email change: Yes

For production, configure SMTP:
- Go to **Authentication > Email**
- Custom SMTP settings

(During development, Supabase provides test emails you can use)

### 7. Create Admin User

To access the admin dashboard:

1. Sign up with an email via the app
2. In Supabase Dashboard:
   - Go to **SQL Editor**
   - Run this query (replace with your user ID):

```sql
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = 'your-user-id';
```

3. Access admin panel at `/admin`

### 8. Run Development Server

```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Features

### User Features

**Authentication**
- Passwordless OTP via email
- Secure session management
- User profiles

**Library**
- Browse thousands of books
- Search by title or author
- Filter by category
- View book details & cover images

**Borrowing System**
- Borrow books (14-day loan period)
- Track borrowing history
- See due dates
- Return books

**Wishlists**
- Save books for later
- Manage wishlist items
- Quick borrow from wishlist

**Reviews & Ratings**
- Rate books (1-5 stars)
- Write detailed reviews
- See community ratings
- Average rating per book

**Dashboard**
- Personalized library overview
- Active borrowings
- Wishlist items
- Reading statistics

### Admin Features

**Book Management**
- Add new books
- Edit book information
- Delete books
- Manage inventory (total/available copies)
- Upload cover images

**User Management** (via Supabase)
- View all users
- Manage user roles

## Database Schema

### profiles
- Stores user profile information
- Auto-created on signup via trigger
- Role-based access (user/admin)

### books
- Complete book catalog
- ISBN, category, publication year
- Inventory tracking

### book_borrows
- Borrowing records
- Due dates & return dates
- Status tracking (borrowed/returned/overdue)

### wishlist
- User bookmarked books
- One entry per user/book combination

### book_reviews
- User ratings (1-5 stars)
- Review text
- One review per user/book

## Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables
5. Deploy!

```bash
# Or use Vercel CLI
npm i -g vercel
vercel
```

### Production Setup

1. Update `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` to your production URL
2. Configure custom domain in Supabase
3. Set up custom SMTP for emails
4. Enable HTTPS (automatic on Vercel)
5. Review Row Level Security (RLS) policies

## Key Learning Concepts

This project demonstrates:

### Full-Stack Development
- Server Components (RSC) for data fetching
- Client Components for interactivity
- API Routes for backend logic

### Database Design
- Relational schema with foreign keys
- Row Level Security (RLS) for data protection
- Triggers for automated workflows

### Authentication
- Passwordless authentication (OTP)
- Session management
- Protected routes & middleware

### React Patterns
- State management with hooks
- Server/client data synchronization
- Form handling & validation

### Tailwind CSS
- Responsive design
- Component-based styling
- Dark mode support ready

## Troubleshooting

**OTP not received?**
- Check spam folder
- Use test credentials (check Supabase logs)
- Verify SMTP is configured

**Database errors?**
- Ensure SQL schema was executed
- Check RLS policies in Supabase
- Verify service role key is correct

**Can't access admin?**
- Confirm user role is 'admin' in profiles table
- Check middleware redirect logic

**Books not loading?**
- Verify books table has data (check Supabase dashboard)
- Check browser network tab for errors
- Inspect browser console for logs

## Next Steps & Enhancements

Ideas to extend this project:

1. **Advanced Search**
   - Full-text search
   - Advanced filters (rating, publication year)

2. **Notifications**
   - Email reminders for due dates
   - Book availability alerts

3. **Social Features**
   - Follow other readers
   - Book clubs / reading groups
   - Social sharing

4. **Analytics**
   - User reading statistics
   - Popular books
   - Admin analytics dashboard

5. **Mobile App**
   - React Native version
   - Offline reading progress

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)
- [React Documentation](https://react.dev)

## License

MIT - Feel free to use for learning and personal projects!

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Supabase error logs
3. Check browser console for errors
4. Refer to framework documentation

---

Happy reading! 📚
