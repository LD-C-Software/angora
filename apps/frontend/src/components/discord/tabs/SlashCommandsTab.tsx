export function SlashCommandsTab() {
  return (
    <div>
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', color: '#a5b4fc' }}>
          Command Registry Overview
        </h3>
        <div className="command-list">
          <div className="command-item">
            <div>
              <div className="command-name">/ping</div>
              <div className="command-desc">
                Checks bot WebSocket latency & API roundtrip latency
              </div>
            </div>
            <span className="status-badge active">Registered</span>
          </div>
          <div
            className="command-item"
            style={{ opacity: 0.6, borderStyle: 'dashed' }}
          >
            <div>
              <div className="command-name">/angora (Dedicated)</div>
              <div className="command-desc">
                Placeholder slot ready for custom dedicated commands
              </div>
            </div>
            <span className="status-badge inactive">
              Ready for implementation
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
