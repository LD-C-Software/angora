import { useState, useCallback, type ReactNode } from 'react'
import { TIMING_CONFIG } from '../constants'
import type { ToastNotification, ToastType } from '../types'
import { ToastContext } from './toastContextDef'

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastNotification[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback(
    (type: ToastType, title: string, message: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      setToasts((prev) => [...prev, { id, type, title, message }])
      setTimeout(() => {
        removeToast(id)
      }, TIMING_CONFIG.TOAST_AUTO_DISMISS_MS)
    },
    [removeToast],
  )

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  )
}
