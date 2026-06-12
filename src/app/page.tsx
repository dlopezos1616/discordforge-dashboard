'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { LandingPage } from '@/components/landing/LandingPage'
import { ServerSelectPage } from '@/components/landing/ServerSelectPage'
import { DashboardShell } from '@/components/dashboard/DashboardShell'

export default function Home() {
  const { view, setView, setUser, isAuthenticated } = useAppStore()

  // Check for existing Discord session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/session')
        const data = await res.json()

        if (data.authenticated && data.user) {
          setUser({
            id: data.user.id,
            discordId: data.user.id,
            username: data.user.username,
            avatar: data.user.avatar
              ? `https://cdn.discordapp.com/avatars/${data.user.id}/${data.user.avatar}.png`
              : null,
            isAdmin: true,
            email: data.user.email,
          })

          // Check URL params for auth callback
          const params = new URLSearchParams(window.location.search)
          if (params.get('auth') === 'success') {
            setView('server-select')
            // Clean URL
            window.history.replaceState({}, '', '/')
          } else {
            // Already authenticated, go to server select
            setView('server-select')
          }
        }
      } catch (err) {
        console.error('Session check error:', err)
      }
    }

    checkSession()
  }, [setUser, setView])

  // Landing page (public)
  if (view === 'landing') {
    return <LandingPage />
  }

  // Server selection (authenticated but no server selected)
  if (view === 'server-select') {
    return <ServerSelectPage />
  }

  // Dashboard (server selected)
  return <DashboardShell />
}
