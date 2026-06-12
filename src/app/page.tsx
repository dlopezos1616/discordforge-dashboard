'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { LandingPage } from '@/components/landing/LandingPage'
import { ServerSelectPage } from '@/components/landing/ServerSelectPage'
import { DashboardShell } from '@/components/dashboard/DashboardShell'

export default function Home() {
  const { view, setView, setUser } = useAppStore()

  // Check for existing Discord session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Check URL params for auth callback first
        const params = new URLSearchParams(window.location.search)
        const authStatus = params.get('auth')

        if (authStatus === 'error') {
          // OAuth failed - show error on landing
          console.error('Discord OAuth failed')
          window.history.replaceState({}, '', '/')
          return
        }

        if (authStatus === 'denied') {
          window.history.replaceState({}, '', '/')
          return
        }

        // Check for existing session
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

          if (authStatus === 'success') {
            setView('server-select')
            window.history.replaceState({}, '', '/')
          } else {
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
