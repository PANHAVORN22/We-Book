import { Suspense } from 'react'

import AdminPageClient from './admin-page-client'

export const dynamic = 'force-dynamic'

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
          <p className="text-slate-600">Loading admin...</p>
        </div>
      }
    >
      <AdminPageClient />
    </Suspense>
  )
}
