import { createContext } from 'react'
import type { ToastNotification, ToastType } from '../types'

export interface ToastContextValue {
  toasts: ToastNotification[]
  addToast: (type: ToastType, title: string, message: string) => void
  removeToast: (id: string) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)
