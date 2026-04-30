import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BookOpen, Search, Users, Award } from 'lucide-react'

export const metadata = {
  title: 'BookVault - Online Library',
  description: 'Discover, read, and manage your favorite books online',
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border sticky top-0 z-50 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-lg">
              <BookOpen className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">BookVault</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" className="text-foreground font-semibold">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button className="bg-primary text-primary-foreground font-bold hover:bg-primary/90">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="text-center">
          <h1 className="text-5xl sm:text-6xl font-bold text-foreground mb-6">
            Your Library, Your Way
          </h1>
          <p className="text-lg sm:text-xl text-foreground/70 mb-10 max-w-2xl mx-auto">
            Browse thousands of books, create wishlists, track your reading history, and discover your next favorite read.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/sign-up">
              <Button size="lg" className="bg-primary text-primary-foreground font-bold h-12 px-8 text-base hover:bg-primary/90">
                Start Reading Now
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="border-2 border-primary text-primary font-bold h-12 px-8 text-base hover:bg-primary/5">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-16">
          <div className="bg-secondary rounded-lg p-12 flex items-center justify-center">
            <BookOpen className="h-32 w-32 text-primary/40" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-secondary py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Why Choose BookVault?
            </h2>
            <p className="text-lg text-foreground/60 max-w-2xl mx-auto">
              Everything you need for the perfect reading experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: BookOpen,
                title: 'Vast Collection',
                description: 'Browse thousands of books across all genres',
              },
              {
                icon: Search,
                title: 'Easy Discovery',
                description: 'Advanced search and filtering options',
              },
              {
                icon: Users,
                title: 'Community Reviews',
                description: 'Read and write reviews from fellow readers',
              },
              {
                icon: Award,
                title: 'Track Progress',
                description: 'Track your reading and create wishlists',
              },
            ].map((feature, idx) => {
              const Icon = feature.icon
              return (
                <div
                  key={idx}
                  className="bg-card rounded-lg p-6 border border-border hover:shadow-md transition-shadow"
                >
                  <Icon className="h-8 w-8 text-primary mb-4" />
                  <h3 className="font-bold text-foreground mb-2 text-lg">{feature.title}</h3>
                  <p className="text-foreground/60 text-sm">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-4">Ready to Find Your Next Book?</h2>
          <p className="text-lg mb-8 opacity-90">
            Join thousands of book lovers who are discovering amazing reads.
          </p>
          <Link href="/auth/sign-up">
            <Button size="lg" className="bg-primary-foreground text-primary font-bold h-12 px-8 text-base hover:bg-primary-foreground/90">
              Create Free Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-primary p-2 rounded-lg">
                  <BookOpen className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-foreground">BookVault</span>
              </div>
              <p className="text-foreground/60 text-sm">Your digital library for discovering amazing books.</p>
            </div>
            <div>
              <h4 className="font-bold text-foreground mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-foreground/60">
                <li><Link href="/library" className="hover:text-primary transition-colors">Browse Books</Link></li>
                <li><Link href="/auth/sign-up" className="hover:text-primary transition-colors">Sign Up</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-foreground mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-foreground/60">
                <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center text-sm text-foreground/60">
            <p>&copy; 2024 BookVault. All rights reserved. Built with modern web technologies.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
