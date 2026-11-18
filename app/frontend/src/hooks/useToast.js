import { useContext } from 'react'
import { ToastContext } from '../context/toastContext'

// Uso: const mostrarToast = useToast(); mostrarToast('Voto registrado.')
export function useToast() {
  const contexto = useContext(ToastContext)
  if (!contexto) throw new Error('useToast precisa estar dentro de <ToastProvider>')
  return contexto
}
