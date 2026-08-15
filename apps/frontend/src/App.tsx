import { useState, useEffect, useCallback } from 'react'
import {
  APP_ROUTES,
  API_ENDPOINTS,
  DISCORD_CONFIG,
  TIMING_CONFIG,
  TOAST_MESSAGES,
} from './constants'

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

export interface ToastNotification {
  id: string
  type: 'error' | 'warning' | 'success' | 'info'
  title: string
  message: string
}

export function App() {
  // Navigation Routing State
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname.startsWith('/discord')
      ? APP_ROUTES.DISCORD_BOT
      : APP_ROUTES.HOME
  })

  // Discord Manager Sub-tabs
  const [activeTab, setActiveTab] = useState<'discord' | 'commands' | 'health'>(
    'discord',
  )
  const [servers, setServers] = useState<DiscordServer[]>([])
  const [inviteData, setInviteData] = useState<InviteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toasts, setToasts] = useState<ToastNotification[]>([])

  const addToast = useCallback(
    (
      type: 'error' | 'warning' | 'success' | 'info',
      title: string,
      message: string,
    ) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      setToasts((prev) => [...prev, { id, type, title, message }])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, TIMING_CONFIG.TOAST_AUTO_DISMISS_MS)
    },
    [],
  )

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // Global window error & rejection handlers to capture errors as toasts instead of console spew
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      event.preventDefault()
      const toastData = TOAST_MESSAGES.UNHANDLED_ERROR(event.message)
      addToast('error', toastData.title, toastData.message)
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      event.preventDefault()
      const reason =
        event.reason instanceof Error
          ? event.reason.message
          : typeof event.reason === 'string'
            ? event.reason
            : undefined
      const toastData = TOAST_MESSAGES.UNHANDLED_REJECTION(reason)
      addToast('error', toastData.title, toastData.message)
    }

    window.addEventListener('error', handleGlobalError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleGlobalError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [addToast])

  // Handle client-side routing
  const navigate = (path: string) => {
    window.history.pushState({}, '', path)
    setCurrentPath(
      path.startsWith('/discord') ? APP_ROUTES.DISCORD_BOT : APP_ROUTES.HOME,
    )
  }

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname
      setCurrentPath(
        path.startsWith('/discord') ? APP_ROUTES.DISCORD_BOT : APP_ROUTES.HOME,
      )
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Fetch servers and invite link
  const fetchServers = useCallback(
    (showLoadingSpinner: boolean = false) => {
      if (typeof showLoadingSpinner === 'boolean' && showLoadingSpinner) {
        setLoading(true)
      }
      fetch(API_ENDPOINTS.DISCORD_SERVERS)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          return res.json()
        })
        .then((data: DiscordServer[]) => {
          setServers(data)
          setError(null)
          setLoading(false)
          if (showLoadingSpinner) {
            addToast(
              'success',
              TOAST_MESSAGES.SYNC_SUCCESS.title,
              TOAST_MESSAGES.SYNC_SUCCESS.message,
            )
          }
        })
        .catch((err) => {
          const toastData = TOAST_MESSAGES.SYNC_ERROR(err.message)
          setError(toastData.message)
          setLoading(false)
          if (showLoadingSpinner) {
            addToast('error', toastData.title, toastData.message)
          }
        })
    },
    [addToast],
  )

  const fetchInviteLink = useCallback(() => {
    fetch(API_ENDPOINTS.DISCORD_BOT_INVITE)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data: InviteData) => setInviteData(data))
      .catch((err) => {
        const toastData = TOAST_MESSAGES.INVITE_FETCH_ERROR(err.message)
        addToast('warning', toastData.title, toastData.message)
      })
  }, [addToast])

  useEffect(() => {
    let isMounted = true

    const loadServers = (showLoading = false) => {
      if (showLoading) setLoading(true)
      fetch(API_ENDPOINTS.DISCORD_SERVERS)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          return res.json()
        })
        .then((data: DiscordServer[]) => {
          if (isMounted) {
            setServers(data)
            setError(null)
            setLoading(false)
          }
        })
        .catch((err) => {
          if (isMounted) {
            const toastData = TOAST_MESSAGES.SYNC_ERROR(err.message)
            setError(toastData.message)
            setLoading(false)
            if (showLoading) {
              addToast('error', toastData.title, toastData.message)
            }
          }
        })
    }

    loadServers(true)
    fetchInviteLink()

    // Silent background poll so when bot joins/leaves, UI updates immediately
    const pollInterval = setInterval(() => {
      loadServers(false)
    }, TIMING_CONFIG.BACKGROUND_POLL_INTERVAL_MS)

    // Refetch when returning to the tab (e.g. after Discord OAuth flow)
    const handleFocus = () => loadServers(false)
    window.addEventListener('focus', handleFocus)

    return () => {
      isMounted = false
      clearInterval(pollInterval)
      window.removeEventListener('focus', handleFocus)
    }
  }, [fetchInviteLink, addToast])

  const handleDeleteServer = (id: string, serverName?: string) => {
    if (
      !confirm(
        `Are you sure you want to disconnect ${serverName || 'this Discord server'}?`,
      )
    )
      return

    // Optimistically update card UI immediately
    setServers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, botJoined: false } : s)),
    )

    fetch(API_ENDPOINTS.DISCORD_SERVER_BY_ID(id), {
      method: 'DELETE',
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const toastData = TOAST_MESSAGES.SERVER_DISCONNECT_REQUESTED(serverName)
        addToast('info', toastData.title, toastData.message)
      })
      .catch((err) => {
        const toastData = TOAST_MESSAGES.SERVER_DISCONNECT_FAILED(
          serverName,
          err.message,
        )
        addToast('error', toastData.title, toastData.message)
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
                  'https://discord.com/oauth2/authorize?client_id=123456789012345678&scope=bot+applications.commands&permissions=2147568640'
                }
                target="_blank"
                rel="noreferrer"
                className="btn btn-discord"
              >
                🤖 Add Bot to Server (OAuth)
              </a>
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
                    Invite the bot to your Discord server to get started.
                  </p>
                  <a
                    href={
                      inviteData?.inviteUrl ||
                      DISCORD_CONFIG.FALLBACK_INVITE_URL
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
                          onClick={() =>
                            handleDeleteServer(server.id, server.name)
                          }
                        >
                          Remove
                        </button>
                      ) : (
                        <a
                          href={
                            inviteData?.inviteUrl ||
                            DISCORD_CONFIG.FALLBACK_INVITE_URL
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

      {/* Toast Notification Container */}
      <div
        className="toast-container"
        role="region"
        aria-label="Notifications"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <div className="toast-icon">
              {toast.type === 'error' && '❌'}
              {toast.type === 'warning' && '⚠️'}
              {toast.type === 'success' && '✅'}
              {toast.type === 'info' && 'ℹ️'}
            </div>
            <div className="toast-content">
              <div className="toast-title">{toast.title}</div>
              <div className="toast-message">{toast.message}</div>
            </div>
            <button
              className="toast-close"
              onClick={() => removeToast(toast.id)}
              aria-label="Close notification"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
