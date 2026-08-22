import { Bell, Settings } from 'lucide-react'
import { Link, useMatches, useNavigate } from 'react-router'
import { Avatar } from '../ui/Avatar'
import { IconButton } from '../ui/IconButton'
import { SearchInput } from '../ui/SearchInput'
import { ROUTES } from '../../routes'
import styles from './TopBar.module.css'

export interface RouteCrumb {
  label: string
  path?: string
}

export interface RouteHandle {
  title?: string
  crumbs?: RouteCrumb[]
}

function isRouteHandle(handle: unknown): handle is RouteHandle {
  return typeof handle === 'object' && handle !== null
}

export function TopBar() {
  const navigate = useNavigate()
  const matches = useMatches()

  const handle = [...matches]
    .reverse()
    .map((match) => match.handle)
    .find(isRouteHandle)

  return (
    <div className={styles.top}>
      {handle?.crumbs ? (
        <h1>
          {handle.crumbs.map((crumb, i) => (
            <span key={crumb.label}>
              {crumb.path ? (
                <Link to={crumb.path} className={styles.crumb}>
                  {crumb.label}
                </Link>
              ) : (
                <span className={styles.crumbActive}>{crumb.label}</span>
              )}
              {i < handle.crumbs!.length - 1 && (
                <span className={styles.crumbSep}>/</span>
              )}
            </span>
          ))}
        </h1>
      ) : (
        <h1>{handle?.title}</h1>
      )}

      <SearchInput placeholder="Search tickets, contacts, messages…" />

      <div className={styles.actions}>
        <IconButton icon={Bell} label="Notifications" withDot />
        <IconButton
          icon={Settings}
          label="Settings"
          onClick={() => navigate(ROUTES.SETTINGS)}
        />
        <Avatar name="Angora Admin" size="md" />
      </div>
    </div>
  )
}
