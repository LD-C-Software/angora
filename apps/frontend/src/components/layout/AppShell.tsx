import { Outlet, useLocation } from 'react-router'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { ROUTES } from '../../routes'
import styles from './AppShell.module.css'

export function AppShell() {
  const location = useLocation()
  const mode = location.pathname.startsWith(ROUTES.SETTINGS)
    ? 'settings'
    : 'main'

  return (
    <div className={styles.shell}>
      <Sidebar mode={mode} />
      <div className={styles.main}>
        <TopBar />
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
