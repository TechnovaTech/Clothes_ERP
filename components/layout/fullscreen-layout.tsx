"use client"

import type React from "react"

interface FullscreenLayoutProps {
  children: React.ReactNode
}

export function FullscreenLayout({ children }: FullscreenLayoutProps) {
  return (
    <div className="h-screen w-screen bg-background overflow-hidden">
      {children}
    </div>
  )
}
