import { useCallback, useEffect, useState } from 'react'
import { ToastContext } from '../context/toastContext'
import Icone from './Icone'

const DURACAO_MS = 2600

export default function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)

  const mostrarToast = useCallback((texto, tom = 'ok') => {
    setToast({ texto, tom, chave: Date.now() })
  }, [])

  // Some sozinho depois de alguns segundos.
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), DURACAO_MS)
    return () => clearTimeout(timer)
  }, [toast])

  return (
    <ToastContext.Provider value={mostrarToast}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-[1000] flex justify-center px-4 md:bottom-8">
        {toast && (
          <p
            key={toast.chave}
            className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold shadow-lg ${
              toast.tom === 'erro' ? 'bg-bad text-card' : 'bg-ink text-card'
            }`}
          >
            <Icone nome={toast.tom === 'erro' ? 'alerta' : 'check'} className="size-4" />
            {toast.texto}
          </p>
        )}
      </div>
    </ToastContext.Provider>
  )
}
