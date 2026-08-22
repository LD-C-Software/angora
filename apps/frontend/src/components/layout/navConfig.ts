import type { LucideIcon } from 'lucide-react'
import { Home, MessageSquare, X } from 'lucide-react'
import { ROUTES } from '../../routes'

export interface NavItem {
  label: string
  path: string
  icon: LucideIcon
  end?: boolean
  countKey?: string
}

export interface NavSection {
  section: string
  items: NavItem[]
}

export const MAIN_NAV: NavSection[] = [
  {
    section: 'Overview',
    items: [{ label: 'Home', path: ROUTES.HOME, icon: Home, end: true }],
  },
  {
    section: 'Integrations',
    items: [
      {
        label: 'Discord Bot',
        path: ROUTES.DISCORD.ROOT,
        icon: MessageSquare,
        countKey: 'discordServers',
      },
    ],
  },
]

export const SETTINGS_NAV: NavSection[] = [
  {
    section: 'Settings',
    items: [{ label: 'Exit Settings', path: ROUTES.HOME, icon: X }],
  },
]
