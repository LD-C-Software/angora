import { useOutletContext } from 'react-router'
import { DISCORD_CONFIG } from '../../../constants'
import type { DiscordOutletContext } from '../../../types'
import { Card, LinkButton, Pill } from '../../ui'
import { ServerCard } from './ServerCard'

export function ConnectedServersTab() {
  const { servers, inviteData, loading, error, leaveServer } =
    useOutletContext<DiscordOutletContext>()
  const inviteUrl = inviteData?.inviteUrl || DISCORD_CONFIG.FALLBACK_INVITE_URL

  return (
    <div>
      {loading && (
        <p
          style={{
            color: 'var(--color-text-secondary)',
            padding: 'var(--space-6) 0',
          }}
        >
          Loading connected servers...
        </p>
      )}

      {error && (
        <p
          style={{
            color: 'var(--color-danger-text)',
            padding: 'var(--space-6) 0',
          }}
        >
          Error loading servers: {error}
        </p>
      )}

      {!loading && servers.length === 0 && (
        <Card>
          <div style={{ textAlign: 'center', padding: 'var(--space-9) 0' }}>
            <h3>No Discord Servers Connected</h3>
            <p
              style={{
                color: 'var(--color-text-secondary)',
                margin: 'var(--space-3) 0 var(--space-7)',
              }}
            >
              Invite the bot to your Discord server to get started.
            </p>
            <LinkButton
              href={inviteUrl}
              target="_blank"
              rel="noreferrer"
              variant="primary"
            >
              Invite Bot to Discord Server (OAuth)
            </LinkButton>
          </div>
        </Card>
      )}

      {!loading && servers.length > 0 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--space-7)',
            padding: 'var(--space-3) var(--space-5)',
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-control)',
            border: '0.0625rem solid var(--color-border)',
          }}
        >
          <span
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-secondary)',
              fontWeight: 'var(--font-weight-medium)',
            }}
          >
            {servers.length} server{servers.length === 1 ? '' : 's'} registered
          </span>
          <Pill variant="positive">Live auto-sync active</Pill>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(20rem, 1fr))',
          gap: 'var(--space-8)',
        }}
      >
        {servers.map((server) => (
          <ServerCard
            key={server.id}
            server={server}
            inviteUrl={inviteData?.inviteUrl}
            onLeave={leaveServer}
          />
        ))}
      </div>
    </div>
  )
}
