import { NavLink, Outlet } from 'react-router'
import { useDiscordServers } from '../../hooks/useDiscordServers'
import { DISCORD_CONFIG } from '../../constants'
import { ROUTES } from '../../routes'
import { CountBadge, LinkButton } from '../ui'
import tabButtonStyles from '../ui/TabButton.module.css'

function tabClassName({ isActive }: { isActive: boolean }): string {
  return `${tabButtonStyles.tabBtn}${isActive ? ` ${tabButtonStyles.active}` : ''}`
}

export function DiscordPage() {
  const { servers, inviteData, loading, error, leaveServer } =
    useDiscordServers()
  const inviteUrl = inviteData?.inviteUrl || DISCORD_CONFIG.FALLBACK_INVITE_URL

  return (
    <div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 'var(--space-6)',
          marginBottom: 'var(--space-8)',
        }}
      >
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Manage connected Discord servers, invite Angora Bot, and view slash
          commands.
        </p>
        <LinkButton
          href={inviteUrl}
          target="_blank"
          rel="noreferrer"
          variant="primary"
        >
          Add Bot to Server (OAuth)
        </LinkButton>
      </div>

      <nav
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-8)',
        }}
      >
        <NavLink to={ROUTES.DISCORD.SERVERS} className={tabClassName}>
          {({ isActive }) => (
            <>
              Connected Servers{' '}
              <CountBadge count={servers.length} active={isActive} />
            </>
          )}
        </NavLink>
        <NavLink to={ROUTES.DISCORD.COMMANDS} className={tabClassName}>
          Slash Commands
        </NavLink>
        <NavLink to={ROUTES.DISCORD.HEALTH} className={tabClassName}>
          Backend Health
        </NavLink>
      </nav>

      <Outlet context={{ servers, inviteData, loading, error, leaveServer }} />
    </div>
  )
}
