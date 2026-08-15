import { useState, useEffect, useCallback } from 'react'
import { APP_ROUTES } from '../constants'

export function useNavigation() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname.startsWith('/discord')
      ? APP_ROUTES.DISCORD_BOT
      : APP_ROUTES.HOME
  })

  const navigate = useCallback((path: string) => {
    window.history.pushState({}, '', path)
    setCurrentPath(
      path.startsWith('/discord') ? APP_ROUTES.DISCORD_BOT : APP_ROUTES.HOME,
    )
  }, [])

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname
      setCurrentPath(
        path.startsWith('/discord') ? APP_ROUTES.DISCORD_BOT : APP_ROUTES.HOME,
      )
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  return { currentPath, navigate }
}
