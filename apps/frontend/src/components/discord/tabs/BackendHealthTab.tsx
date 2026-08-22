import { useOutletContext } from 'react-router'
import type { DiscordOutletContext } from '../../../types'
import { Card } from '../../ui'

export function BackendHealthTab() {
  const { inviteData } = useOutletContext<DiscordOutletContext>()

  return (
    <Card>
      <Card.Header title="Discord OAuth Invite Link Data" />
      <pre
        style={{
          background: 'var(--color-canvas)',
          padding: 'var(--space-6)',
          borderRadius: 'var(--radius-control)',
          overflowX: 'auto',
          color: 'var(--color-text-secondary)',
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--font-size-sm)',
        }}
      >
        {JSON.stringify(inviteData, null, 2)}
      </pre>
    </Card>
  )
}
