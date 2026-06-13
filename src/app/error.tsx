'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Flame, RefreshCw, AlertCircle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to console for debugging
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF6600] to-[#DC2626] flex items-center justify-center shadow-[0_0_20px_rgba(255,102,0,0.3)]">
            <AlertCircle className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white">¡Ups! Algo salió mal</h2>
        <p className="text-[#888] text-sm leading-relaxed">
          Ha ocurrido un error inesperado. Esto puede deberse a un problema de conexión o de datos.
        </p>
        {error?.message && (
          <div className="bg-[#111] border border-white/10 rounded-lg p-3 text-left">
            <p className="text-[10px] text-[#FF6600] font-mono break-all">{error.message}</p>
            {error.digest && (
              <p className="text-[9px] text-[#666] mt-1">Digest: {error.digest}</p>
            )}
          </div>
        )}
        <div className="flex gap-3 justify-center">
          <Button
            onClick={() => reset()}
            className="bg-gradient-to-r from-[#FF6600] to-[#DC2626] hover:from-[#FF6600]/90 hover:to-[#DC2626]/90 text-white gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = '/'}
            className="border-[#FF6600]/30 text-[#FF6600] hover:bg-[#FF6600]/10 gap-2"
          >
            <Flame className="w-4 h-4" />
            Inicio
          </Button>
        </div>
      </div>
    </div>
  )
}
