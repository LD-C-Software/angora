import { DISCORD_CONFIG } from '../../../constants'
import type { DiscordServer } from '../../../types'

interface ServerCardProps {
  server: DiscordServer
  inviteUrl?: string
  onLeave: (id: string, name: string) => void
}

export function ServerCard({ server, inviteUrl, onLeave }: ServerCardProps) {
  const isConnected = server.botJoined !== false
  const fallbackUrl = inviteUrl || DISCORD_CONFIG.FALLBACK_INVITE_URL

  return (
    <div className="card">
      <div className="server-header">
        <div className="server-icon">
          {server.iconUrl ? (
            <img src={server.iconUrl} alt={server.name} />
          ) : (
            server.name.substring(0, 2).toUpperCase()
          )}
        </div>
        <div className="server-info">
          <div className="server-name">{server.name}</div>
          <div className="server-id">ID: {server.guildId}</div>
        </div>
      </div>

      <div
        style={{
          fontSize: '0.85rem',
          color: 'var(--text-secondary)',
          marginBottom: '0.5rem',
        }}
      >
        👥 Members: <strong>{server.memberCount}</strong>
      </div>

      <div className="server-meta">
        <span className={`status-badge ${isConnected ? 'active' : 'inactive'}`}>
          <span className="status-dot"></span>
          {isConnected ? 'Bot Connected' : 'Bot Left'}
        </span>

        {isConnected ? (
          <button
            className="btn btn-danger"
            onClick={() => onLeave(server.id, server.name)}
          >
            Remove
          </button>
        ) : (
          <a
            href={fallbackUrl}
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary"
          >
            🔄 Reconnect
          </a>
        )}
      </div>
    </div>
  )
}
