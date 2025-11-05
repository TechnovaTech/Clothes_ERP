'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'

export default function ManufacturerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()

  if (status === 'loading') return <div>Loading...</div>
  
  if (!session) {
    redirect('/login')
  }

  // Redirect factory managers to their specific dashboard
  if (session.user.role === 'factory-manager') {
    redirect('/factory')
  }

  // Only allow manufacturer tenant admins
  if (session.user.role !== 'tenant-admin' || session.user.tenantType !== 'manufacturer') {
    redirect('/login')
  }

  return <MainLayout userType="manufacturer">{children}</MainLayout>
}