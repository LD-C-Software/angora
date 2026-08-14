import React, { useState, useEffect, useCallback } from 'react'

interface DiscordServer {
  id: string
  guildId: string
  name: string
  iconUrl?: string | null
  ownerId?: string | null
  memberCount: number
  botJoined: boolean
  createdAt: string
  updatedAt: string
}

interface InviteData {
  inviteUrl: string
  clientId: string
}

export function App() {
  // Navigation Routing State
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname.startsWith('/discord') ? '/discordbot' : '/'
  })

  // Discord Manager Sub-tabs
  const [activeTab, setActiveTab] = useState<'discord' | 'commands' | 'health'>(
    'discord',
  )
  const [servers, setServers] = useState<DiscordServer[]>([])
  const [inviteData, setInviteData] = useState<InviteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  // Manual server form state
  const [manualGuildId, setManualGuildId] = useState('')
  const [manualName, setManualName] = useState('')
  const [manualMemberCount, setManualMemberCount] = useState(10)

  // Handle client-side routing
  const navigate = (path: string) => {
    window.history.pushState({}, '', path)
    setCurrentPath(path.startsWith('/discord') ? '/discordbot' : '/')
  }

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname
      setCurrentPath(path.startsWith('/discord') ? '/discordbot' : '/')
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Fetch servers and invite link
  const fetchServers = useCallback((showLoadingSpinner: boolean = false) => {
    if (typeof showLoadingSpinner === 'boolean' && showLoadingSpinner) {
      setLoading(true)
    }
    fetch('/api/discord/servers')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`)
        return res.json()
      })
      .then((data: DiscordServer[]) => {
        setServers(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  const fetchInviteLink = useCallback(() => {
    fetch('/api/discord/bot/invite')
      .then((res) => res.json())
      .then((data: InviteData) => setInviteData(data))
      .catch((err) => console.error('Failed to fetch invite URL:', err))
  }, [])

  useEffect(() => {
    let isMounted = true

    const loadServers = (showLoading = false) => {
      if (showLoading) setLoading(true)
      fetch('/api/discord/servers')
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP error ${res.status}`)
          return res.json()
        })
        .then((data: DiscordServer[]) => {
          if (isMounted) {
            setServers(data)
            setLoading(false)
          }
        })
        .catch((err) => {
          if (isMounted) {
            setError(err.message)
            setLoading(false)
          }
        })
    }

    loadServers(true)
    fetchInviteLink()

    // Silent background poll every 2.5s so when bot joins/leaves, UI updates immediately
    const pollInterval = setInterval(() => {
      loadServers(false)
    }, 2500)

    // Refetch when returning to the tab (e.g. after Discord OAuth flow)
    const handleFocus = () => loadServers(false)
    window.addEventListener('focus', handleFocus)

    return () => {
      isMounted = false
      clearInterval(pollInterval)
      window.removeEventListener('focus', handleFocus)
    }
  }, [fetchInviteLink])

  const handleRegisterServer = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualGuildId || !manualName) return

    fetch('/api/discord/servers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guildId: manualGuildId,
        name: manualName,
        memberCount: Number(manualMemberCount),
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to register server')
        return res.json()
      })
      .then(() => {
        setShowModal(false)
        setManualGuildId('')
        setManualName('')
        fetchServers(false)
      })
      .catch((err) => alert(err.message))
  }

  const handleDeleteServer = (id: string) => {
    if (!confirm('Are you sure you want to remove this Discord server?')) return

    // Optimistically update card UI immediately
    setServers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, botJoined: false } : s)),
    )

    fetch(`/api/discord/servers/${id}`, {
      method: 'DELETE',
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to remove server')
      })
      .catch((err) => {
        alert(err.message)
      })
  }

  return (
    <div className="app-container">
      {/* Top Header */}
      <header className="app-header">
        <div
          className="brand-logo"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          <div className="brand-icon">A</div>
          <div>
            <div className="brand-title">Angora CRM</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Self-Hosted CRM & Integration Stack
            </div>
          </div>
        </div>

        {/* Global Navigation Links */}
        <nav className="top-nav">
          <button
            className={`nav-link ${currentPath === '/' ? 'active' : ''}`}
            onClick={() => navigate('/')}
          >
            🏠 Home
          </button>
          <button
            className={`nav-link nav-btn-discord ${currentPath === '/discordbot' ? 'active' : ''}`}
            onClick={() => navigate('/discordbot')}
          >
            🎮 Discord Bot
          </button>
        </nav>
      </header>

      {/* ======================================================== */}
      {/* ROUTE 1: LANDING PAGE ( / )                              */}
      {/* ======================================================== */}
      {currentPath === '/' && (
        <main>
          {/* Hero Section */}
          <section className="hero-section">
            <div className="hero-badge">✨ Self-Hosted CRM Platform v1.0</div>
            <h1 className="hero-title">
              Manage Support Channels & Discord Integrations Seamlessly
            </h1>
            <p className="hero-subtitle">
              Angora is a modern self-hosted customer support CRM system with
              native integrations for Discord servers, Slack channels, and email
              automated workflows.
            </p>
            <div className="hero-cta-group">
              <button
                className="btn btn-discord"
                style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }}
                onClick={() => navigate('/discordbot')}
              >
                🎮 Open Discord Manager (/discordbot) →
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => fetchServers(true)}
              >
                🔄 Sync System State
              </button>
            </div>
          </section>

          {/* Features Overview Section */}
          <section className="features-section">
            <div className="section-header">
              <h2 className="section-title">Integrated Apps & Modules</h2>
              <p className="section-subtitle">
                Click any module to manage its gateway connection and live
                status
              </p>
            </div>

            <div className="grid-container">
              {/* Discord Feature Card */}
              <div
                className="feature-card"
                style={{ borderColor: 'rgba(88, 101, 242, 0.4)' }}
              >
                <div>
                  <div className="feature-card-header">
                    <div className="feature-icon discord">🎮</div>
                    <span className="status-badge active">
                      <span className="status-dot"></span> Active
                    </span>
                  </div>
                  <h3 className="feature-title">Discord Bot Integration</h3>
                  <p className="feature-desc">
                    View active Discord servers, manage bot OAuth invitation
                    links, track member stats, and execute slash commands
                    (/ping).
                  </p>
                </div>
                <button
                  className="btn btn-discord"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => navigate('/discordbot')}
                >
                  Launch Discord Manager →
                </button>
              </div>

              {/* Slack Feature Card */}
              <div className="feature-card">
                <div>
                  <div className="feature-card-header">
                    <div className="feature-icon">💬</div>
                    <span className="status-badge active">
                      <span className="status-dot"></span> Configured
                    </span>
                  </div>
                  <h3 className="feature-title">Slack Workspace Bot</h3>
                  <p className="feature-desc">
                    Connect support agents with customer support channels,
                    receive ticket updates, and automate workspace
                    notifications.
                  </p>
                </div>
                <button
                  className="btn btn-secondary"
                  disabled
                  style={{ opacity: 0.7 }}
                >
                  Slack Engine Ready
                </button>
              </div>

              {/* Email Feature Card */}
              <div className="feature-card">
                <div>
                  <div className="feature-card-header">
                    <div className="feature-icon">✉️</div>
                    <span className="status-badge active">
                      <span className="status-dot"></span> Configured
                    </span>
                  </div>
                  <h3 className="feature-title">Email Ticket System</h3>
                  <p className="feature-desc">
                    Inbound IMAP/SMTP message listener for automatic ticket
                    generation, response dispatching, and conversation logs.
                  </p>
                </div>
                <button
                  className="btn btn-secondary"
                  disabled
                  style={{ opacity: 0.7 }}
                >
                  Email Engine Ready
                </button>
              </div>

              {/* PostgreSQL Data Card */}
              <div className="feature-card">
                <div>
                  <div className="feature-card-header">
                    <div className="feature-icon">📊</div>
                    <span className="status-badge active">
                      <span className="status-dot"></span> Connected
                    </span>
                  </div>
                  <h3 className="feature-title">PostgreSQL Database</h3>
                  <p className="feature-desc">
                    KTor 3.5.1 Exposed ORM engine powered by PostgreSQL 18 with
                    Flyway automated migrations.
                  </p>
                </div>
                <button
                  className="btn btn-secondary"
                  onClick={() => navigate('/discordbot')}
                >
                  View Connected Records
                </button>
              </div>
            </div>
          </section>
        </main>
      )}

      {/* ======================================================== */}
      {/* ROUTE 2: DISCORD BOT PAGE ( /discordbot )                */}
      {/* ======================================================== */}
      {currentPath === '/discordbot' && (
        <main>
          {/* Breadcrumbs Navigation Bar */}
          <div className="breadcrumb-bar">
            <span className="breadcrumb-item" onClick={() => navigate('/')}>
              🏠 Overview
            </span>
            <span>/</span>
            <span className="breadcrumb-active">
              🎮 Discord Bot Manager (/discordbot)
            </span>
          </div>

          {/* Action Bar */}
          <div className="action-bar">
            <div>
              <h1 className="page-title">Discord Server Integration</h1>
              <p className="page-subtitle">
                Manage connected Discord servers, invite Angora Bot, and view
                slash commands.
              </p>
            </div>
            <div className="btn-group">
              <button
                className="btn btn-secondary"
                onClick={() => navigate('/')}
              >
                ← Back to Home
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => fetchServers(true)}
              >
                🔄 Sync Data
              </button>
              <a
                href={
                  inviteData?.inviteUrl ||
                  'https://discord.com/oauth2/authorize?client_id=123456789012345678&scope=bot+applications.commands&permissions=8'
                }
                target="_blank"
                rel="noreferrer"
                className="btn btn-discord"
              >
                🤖 Add Bot to Server (OAuth)
              </a>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  fetchInviteLink()
                  setShowModal(true)
                }}
              >
                ➕ Register Server
              </button>
            </div>
          </div>

          {/* Discord Navigation Sub-tabs */}
          <nav className="nav-tabs">
            <button
              className={`tab-btn ${activeTab === 'discord' ? 'active' : ''}`}
              onClick={() => setActiveTab('discord')}
            >
              🎮 Connected Servers ({servers.length})
            </button>
            <button
              className={`tab-btn ${activeTab === 'commands' ? 'active' : ''}`}
              onClick={() => setActiveTab('commands')}
            >
              ⚡ Bot Slash Commands
            </button>
            <button
              className={`tab-btn ${activeTab === 'health' ? 'active' : ''}`}
              onClick={() => setActiveTab('health')}
            >
              💚 Backend Health
            </button>
          </nav>

          {/* SUB-TAB 1: CONNECTED SERVERS */}
          {activeTab === 'discord' && (
            <div>
              {loading && (
                <p
                  style={{ color: 'var(--text-secondary)', padding: '1rem 0' }}
                >
                  Loading connected servers...
                </p>
              )}
              {error && (
                <p style={{ color: 'var(--danger)', padding: '1rem 0' }}>
                  Error loading servers: {error}
                </p>
              )}

              {!loading && servers.length === 0 && (
                <div className="empty-state">
                  <div className="empty-icon">🤖</div>
                  <h3>No Discord Servers Connected</h3>
                  <p
                    style={{
                      color: 'var(--text-secondary)',
                      marginBottom: '1.5rem',
                      marginTop: '0.5rem',
                    }}
                  >
                    Invite the bot to your Discord server or list a server
                    manually to get started.
                  </p>
                  <a
                    href={
                      inviteData?.inviteUrl ||
                      'https://discord.com/oauth2/authorize?client_id=123456789012345678&scope=bot+applications.commands&permissions=8'
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-discord"
                  >
                    🤖 Invite Bot to Discord Server (OAuth)
                  </a>
                </div>
              )}

              <div className="grid-container">
                {servers.map((server) => (
                  <div key={server.id} className="card">
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
                      <span
                        className={`status-badge ${server.botJoined !== false ? 'active' : 'inactive'}`}
                      >
                        <span className="status-dot"></span>
                        {server.botJoined !== false
                          ? 'Bot Connected'
                          : 'Bot Left'}
                      </span>

                      {server.botJoined !== false ? (
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDeleteServer(server.id)}
                        >
                          Remove
                        </button>
                      ) : (
                        <a
                          href={
                            inviteData?.inviteUrl ||
                            'https://discord.com/oauth2/authorize?client_id=123456789012345678&scope=bot+applications.commands&permissions=8'
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-primary"
                        >
                          🔄 Reconnect
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUB-TAB 2: SLASH COMMANDS */}
          {activeTab === 'commands' && (
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
          )}

          {/* SUB-TAB 3: BACKEND HEALTH */}
          {activeTab === 'health' && (
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
          )}
        </main>
      )}

      {/* MANUAL REGISTER MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: '1rem' }}>
              List / Register Discord Server
            </h2>
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: '0.85rem',
                marginBottom: '1.5rem',
              }}
            >
              Add a server record manually to register it in your CRM system.
            </p>
            <form onSubmit={handleRegisterServer}>
              <div className="form-group">
                <label className="form-label">Discord Server (Guild) ID</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 102938475665748392"
                  value={manualGuildId}
                  onChange={(e) => setManualGuildId(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Server Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. My Community Server"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Member Count</label>
                <input
                  type="number"
                  className="form-input"
                  value={manualMemberCount}
                  onChange={(e) => setManualMemberCount(Number(e.target.value))}
                />
              </div>
              <div
                className="btn-group"
                style={{ justifyContent: 'flex-end', marginTop: '1.5rem' }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-discord">
                  Save Server
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
