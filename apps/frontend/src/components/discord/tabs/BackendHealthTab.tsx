import type { InviteData } from '../../../types'

interface BackendHealthTabProps {
  inviteData: InviteData | null
}

export function BackendHealthTab({ inviteData }: BackendHealthTabProps) {
  return (
    <div>
      <div className="card">
        <h3 style={{ marginBottom: '0.5rem' }}>
          Discord OAuth Invite Link Data
        </h3>
        <pre
          style={{
            background: 'var(--bg-primary)',
            padding: '1rem',
            borderRadius: '8px',
            overflowX: 'auto',
            color: '#a5b4fc',
            fontSize: '0.85rem',
          }}
        >
          {JSON.stringify(inviteData, null, 2)}
        </pre>
      </div>
    </div>
  )
}
