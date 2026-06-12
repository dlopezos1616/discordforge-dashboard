'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { LandingPage } from '@/components/landing/LandingPage'
import { ServerSelectPage } from '@/components/landing/ServerSelectPage'
import { DashboardShell } from '@/components/dashboard/DashboardShell'

export default function Home() {
  const { view, setView, setUser } = useAppStore()
  const [authError, setAuthError] = useState<string | null>(null)

  // Check for existing Discord session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Check URL params for auth callback first
        const params = new URLSearchParams(window.location.search)
        const authStatus = params.get('auth')
        const authReason = params.get('reason')

        if (authStatus === 'error') {
          // Show specific error message based on reason
          const errorMessages: Record<string, string> = {
            no_secret: 'Error de configuración: falta la clave de Discord. Contacta al administrador.',
            token_exchange: 'Error al verificar con Discord. Intenta de nuevo.',
            user_fetch: 'No se pudo obtener tu perfil de Discord. Intenta de nuevo.',
            exception: 'Ocurrió un error inesperado. Intenta de nuevo.',
          }
          setAuthError(errorMessages[authReason || ''] || 'Error al iniciar sesión con Discord. Intenta de nuevo.')
          window.history.replaceState({}, '', '/')
          return
        }

        if (authStatus === 'denied') {
          setAuthError('Cancelaste el inicio de sesión con Discord.')
          window.history.replaceState({}, '', '/')
          return
        }

        // Clear any previous error
        setAuthError(null)

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
    return <LandingPage authError={authError} onClearError={() => setAuthError(null)} />
  }

  // Server selection (authenticated but no server selected)
  if (view === 'server-select') {
    return <ServerSelectPage />
  }

  // Dashboard (server selected)
  return <DashboardShell />
}
