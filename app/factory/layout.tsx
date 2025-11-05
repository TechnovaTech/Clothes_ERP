'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'

export default function FactoryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()

  if (status === 'loading') return <div>Loading...</div>
  
  if (!session || session.user.role !== 'factory-manager') {
    redirect('/login')
  }

  return <MainLayout userType="factory">{children}</MainLayout>
}