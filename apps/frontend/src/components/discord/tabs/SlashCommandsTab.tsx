import { Card, Pill } from '../../ui'

export function SlashCommandsTab() {
  return (
    <Card>
      <Card.Header title="Command Registry Overview" />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-6)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 'var(--space-6) var(--space-7)',
            border: '0.0625rem solid var(--color-border)',
            borderRadius: 'var(--radius-control)',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-navy)',
              }}
            >
              /ping
            </div>
            <div
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-secondary)',
                marginTop: 'var(--space-1)',
              }}
            >
              Checks bot WebSocket latency & API roundtrip latency
            </div>
          </div>
          <Pill variant="positive">Registered</Pill>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 'var(--space-6) var(--space-7)',
            border: '0.0625rem dashed var(--color-border)',
            borderRadius: 'var(--radius-control)',
            opacity: 0.7,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-navy)',
              }}
            >
              /angora (Dedicated)
            </div>
            <div
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-secondary)',
                marginTop: 'var(--space-1)',
              }}
            >
              Placeholder slot ready for custom dedicated commands
            </div>
          </div>
          <Pill variant="info">Ready for implementation</Pill>
        </div>
      </div>
    </Card>
  )
}
