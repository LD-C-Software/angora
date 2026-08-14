import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  API_ENDPOINTS,
  APP_ROUTES,
  DISCORD_TABS,
  type DiscordTabType,
  TIMING,
  FORM_DEFAULTS,
  TOAST_DEFAULT_TITLES,
  MESSAGES,
  UI_TEXT,
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
  type: 'error' | 'success' | 'warning' | 'info'
  title: string
  message: string
}

/**
 * Fetch wrapper with built-in AbortController timeout to prevent hanging pending requests
 */
async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs: number = TIMING.REQUEST_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
    })
    return response
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error(
        MESSAGES.TIMEOUT_ERROR(timeoutMs / TIMING.MS_PER_SECOND),
        { cause: err },
      )
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Safe JSON response parser that guards against HTML gateway error pages and non-JSON payloads
 */
async function parseJsonResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type') || ''
  if (!res.ok) {
    if (contentType.includes('application/json')) {
      const errData = (await res.json().catch(() => ({}))) as {
        error?: string
      }
      throw new Error(errData.error || `HTTP error ${res.status}`)
    }
    throw new Error(
      `HTTP error ${res.status} (${res.statusText || 'Gateway Error'})`,
    )
  }
  if (!contentType.includes('application/json')) {
    throw new Error('Invalid response format: Expected JSON response')
  }
  const data = (await res.json()) as T
  if (
    typeof data === 'object' &&
    data !== null &&
    'error' in data &&
    typeof (data as { error?: unknown }).error === 'string'
  ) {
    throw new Error((data as { error: string }).error)
  }
  return data
}

export function App() {
  // Navigation Routing State
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname.startsWith(APP_ROUTES.DISCORD_PREFIX)
      ? APP_ROUTES.DISCORD_BOT
      : APP_ROUTES.HOME
  })

  // Discord Manager Sub-tabs
  const [activeTab, setActiveTab] = useState<DiscordTabType>(
    DISCORD_TABS.DISCORD,
  )
  const [servers, setServers] = useState<DiscordServer[]>([])
  const [inviteData, setInviteData] = useState<InviteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [toasts, setToasts] = useState<ToastNotification[]>([])
  const [showModal, setShowModal] = useState(false)

  // Manual server form state
  const [manualGuildId, setManualGuildId] = useState('')
  const [manualName, setManualName] = useState('')
  const [manualMemberCount, setManualMemberCount] = useState<number>(
    FORM_DEFAULTS.DEFAULT_MEMBER_COUNT,
  )

  // Polling lock and error debounce refs
  const isPollingRef = useRef(false)
  const lastBackgroundErrorToastRef = useRef<number>(0)

  // Toast dispatch helper
  const addToast = useCallback(
    (
      message: string,
      type: 'error' | 'success' | 'warning' | 'info' = 'error',
      title?: string,
    ) => {
      const id = Math.random().toString(36).substring(2, 9)
      const newToast: ToastNotification = {
        id,
        type,
        title: title || TOAST_DEFAULT_TITLES[type],
        message,
      }

      setToasts((prev) => [...prev, newToast])

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, TIMING.TOAST_AUTO_DISMISS_MS)
    },
    [],
  )

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // Handle client-side routing
  const navigate = (path: string) => {
    window.history.pushState({}, '', path)
    setCurrentPath(
      path.startsWith(APP_ROUTES.DISCORD_PREFIX)
        ? APP_ROUTES.DISCORD_BOT
        : APP_ROUTES.HOME,
    )
  }

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname
      setCurrentPath(
        path.startsWith(APP_ROUTES.DISCORD_PREFIX)
          ? APP_ROUTES.DISCORD_BOT
          : APP_ROUTES.HOME,
      )
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Fetch servers and invite link
  const fetchServers = useCallback(
    async (showLoadingSpinner: boolean = false) => {
      if (typeof showLoadingSpinner === 'boolean' && showLoadingSpinner) {
        setLoading(true)
      }
      try {
        const res = await fetchWithTimeout(API_ENDPOINTS.SERVERS)
        const data = await parseJsonResponse<DiscordServer[]>(res)
        setServers(data)
        setLoading(false)
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : MESSAGES.SERVERS_FETCH_ERROR
        addToast(message, 'error', TOAST_DEFAULT_TITLES.error)
        setLoading(false)
      }
    },
    [addToast],
  )

  const fetchInviteLink = useCallback(async () => {
    try {
      const res = await fetchWithTimeout(API_ENDPOINTS.INVITE)
      const data = await parseJsonResponse<InviteData>(res)
      setInviteData(data)
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : MESSAGES.INVITE_FETCH_ERROR
      addToast(message, 'warning', MESSAGES.INVITE_CONFIG_TITLE)
    }
  }, [addToast])

  useEffect(() => {
    if (currentPath !== APP_ROUTES.DISCORD_BOT) return

    let isMounted = true

    const loadServers = async (showLoading = false, isBackground = false) => {
      if (isPollingRef.current) return
      isPollingRef.current = true
      if (showLoading) setLoading(true)

      try {
        const res = await fetchWithTimeout(API_ENDPOINTS.SERVERS)
        const data = await parseJsonResponse<DiscordServer[]>(res)
        if (isMounted) {
          setServers(data)
          setLoading(false)
        }
      } catch (err: unknown) {
        if (isMounted) {
          setLoading(false)
          const message =
            err instanceof Error ? err.message : MESSAGES.SERVERS_FETCH_ERROR
          const now = Date.now()
          // For background polling, throttle error toast notifications
          if (
            !isBackground ||
            now - lastBackgroundErrorToastRef.current >
              TIMING.BACKGROUND_ERROR_THROTTLE_MS
          ) {
            lastBackgroundErrorToastRef.current = now
            addToast(message, 'error', TOAST_DEFAULT_TITLES.error)
          }
        }
      } finally {
        isPollingRef.current = false
      }
    }

    const init = async () => {
      await fetchInviteLink()
      await loadServers(true, false)
    }

    void init()

    // Background poll so when bot joins/leaves, UI updates immediately
    const pollInterval = setInterval(() => {
      loadServers(false, true)
    }, TIMING.POLL_INTERVAL_NORMAL_MS)

    // Refetch when returning to the tab (e.g. after Discord OAuth flow)
    const handleFocus = () => loadServers(false, false)
    window.addEventListener('focus', handleFocus)

    return () => {
      isMounted = false
      clearInterval(pollInterval)
      window.removeEventListener('focus', handleFocus)
    }
  }, [currentPath, fetchInviteLink, addToast])

  const handleRegisterServer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualGuildId || !manualName) return

    try {
      const res = await fetchWithTimeout(API_ENDPOINTS.SERVERS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guildId: manualGuildId,
          name: manualName,
          memberCount: Number(manualMemberCount),
        }),
      })
      await parseJsonResponse<{ id: string; status: string }>(res)
      setShowModal(false)
      setManualGuildId('')
      setManualName('')
      addToast(
        MESSAGES.SERVER_REGISTER_SUCCESS(manualName),
        'success',
        TOAST_DEFAULT_TITLES.success,
      )
      fetchServers(false)
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : MESSAGES.SERVER_REGISTER_ERROR
      addToast(message, 'error', TOAST_DEFAULT_TITLES.error)
    }
  }

  const handleDeleteServer = async (id: string) => {
    if (!confirm(MESSAGES.SERVER_DELETE_CONFIRM)) return

    // Optimistically update card UI immediately
    setServers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, botJoined: false } : s)),
    )

    try {
      const res = await fetchWithTimeout(API_ENDPOINTS.DELETE_SERVER(id), {
        method: 'DELETE',
      })
      await parseJsonResponse<{ status: string }>(res)
      addToast(
        MESSAGES.SERVER_REMOVE_SUCCESS,
        'info',
        TOAST_DEFAULT_TITLES.info,
      )
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : MESSAGES.SERVER_REMOVE_ERROR
      addToast(message, 'error', TOAST_DEFAULT_TITLES.error)
    }
  }

  return (
    <div className="app-container">
      {/* Top Header */}
      <header className="app-header">
        <div
          className="brand-logo"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate(APP_ROUTES.HOME)}
        >
          <div className="brand-icon">{UI_TEXT.BRAND.INITIAL}</div>
          <div>
            <div className="brand-title">{UI_TEXT.BRAND.NAME}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {UI_TEXT.BRAND.SUBTITLE}
            </div>
          </div>
        </div>

        {/* Global Navigation Links */}
        <nav className="top-nav">
          <button
            className={`nav-link ${currentPath === APP_ROUTES.HOME ? 'active' : ''}`}
            onClick={() => navigate(APP_ROUTES.HOME)}
          >
            {UI_TEXT.NAV.HOME}
          </button>
          <button
            className={`nav-link nav-btn-discord ${currentPath === APP_ROUTES.DISCORD_BOT ? 'active' : ''}`}
            onClick={() => navigate(APP_ROUTES.DISCORD_BOT)}
          >
            {UI_TEXT.NAV.DISCORD}
          </button>
        </nav>
      </header>

      {/* ======================================================== */}
      {/* ROUTE 1: LANDING PAGE ( / )                              */}
      {/* ======================================================== */}
      {currentPath === APP_ROUTES.HOME && (
        <main>
          {/* Hero Section */}
          <section className="hero-section">
            <div className="hero-badge">{UI_TEXT.HERO.BADGE}</div>
            <h1 className="hero-title">{UI_TEXT.HERO.TITLE}</h1>
            <p className="hero-subtitle">{UI_TEXT.HERO.SUBTITLE}</p>
            <div className="hero-cta-group">
              <button
                className="btn btn-discord"
                style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }}
                onClick={() => navigate(APP_ROUTES.DISCORD_BOT)}
              >
                {UI_TEXT.HERO.CTA_PRIMARY}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => fetchServers(true)}
              >
                {UI_TEXT.HERO.CTA_SECONDARY}
              </button>
            </div>
          </section>

          {/* Features Overview Section */}
          <section className="features-section">
            <div className="section-header">
              <h2 className="section-title">{UI_TEXT.MODULES.SECTION_TITLE}</h2>
              <p className="section-subtitle">
                {UI_TEXT.MODULES.SECTION_SUBTITLE}
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
                  <h3 className="feature-title">
                    {UI_TEXT.MODULES.DISCORD_CARD_TITLE}
                  </h3>
                  <p className="feature-desc">
                    {UI_TEXT.MODULES.DISCORD_CARD_DESC}
                  </p>
                </div>
                <button
                  className="btn btn-discord"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => navigate(APP_ROUTES.DISCORD_BOT)}
                >
                  {UI_TEXT.MODULES.DISCORD_CARD_BTN}
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
                  <h3 className="feature-title">
                    {UI_TEXT.MODULES.SLACK_CARD_TITLE}
                  </h3>
                  <p className="feature-desc">
                    {UI_TEXT.MODULES.SLACK_CARD_DESC}
                  </p>
                </div>
                <button
                  className="btn btn-secondary"
                  disabled
                  style={{ opacity: 0.7 }}
                >
                  {UI_TEXT.MODULES.SLACK_CARD_BTN}
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
                  <h3 className="feature-title">
                    {UI_TEXT.MODULES.EMAIL_CARD_TITLE}
                  </h3>
                  <p className="feature-desc">
                    {UI_TEXT.MODULES.EMAIL_CARD_DESC}
                  </p>
                </div>
                <button
                  className="btn btn-secondary"
                  disabled
                  style={{ opacity: 0.7 }}
                >
                  {UI_TEXT.MODULES.EMAIL_CARD_BTN}
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
                  <h3 className="feature-title">
                    {UI_TEXT.MODULES.DB_CARD_TITLE}
                  </h3>
                  <p className="feature-desc">{UI_TEXT.MODULES.DB_CARD_DESC}</p>
                </div>
                <button
                  className="btn btn-secondary"
                  onClick={() => navigate(APP_ROUTES.DISCORD_BOT)}
                >
                  {UI_TEXT.MODULES.DB_CARD_BTN}
                </button>
              </div>
            </div>
          </section>
        </main>
      )}

      {/* ======================================================== */}
      {/* ROUTE 2: DISCORD BOT PAGE ( /discordbot )                */}
      {/* ======================================================== */}
      {currentPath === APP_ROUTES.DISCORD_BOT && (
        <main>
          {/* Breadcrumbs Navigation Bar */}
          <div className="breadcrumb-bar">
            <span
              className="breadcrumb-item"
              onClick={() => navigate(APP_ROUTES.HOME)}
            >
              {UI_TEXT.DISCORD_MANAGER.BREADCRUMB_OVERVIEW}
            </span>
            <span>/</span>
            <span className="breadcrumb-active">
              {UI_TEXT.DISCORD_MANAGER.BREADCRUMB_DISCORD}
            </span>
          </div>

          {/* Action Bar */}
          <div className="action-bar">
            <div>
              <h1 className="page-title">{UI_TEXT.DISCORD_MANAGER.TITLE}</h1>
              <p className="page-subtitle">
                {UI_TEXT.DISCORD_MANAGER.SUBTITLE}
              </p>
            </div>
            <div className="btn-group">
              <button
                className="btn btn-secondary"
                onClick={() => navigate(APP_ROUTES.HOME)}
              >
                {UI_TEXT.DISCORD_MANAGER.BTN_BACK_HOME}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => fetchServers(true)}
              >
                {UI_TEXT.DISCORD_MANAGER.BTN_SYNC_DATA}
              </button>
              <a
                href={
                  inviteData?.inviteUrl || API_ENDPOINTS.FALLBACK_INVITE_URL
                }
                target="_blank"
                rel="noreferrer"
                className="btn btn-discord"
              >
                {UI_TEXT.DISCORD_MANAGER.BTN_ADD_BOT_OAUTH}
              </a>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  fetchInviteLink()
                  setShowModal(true)
                }}
              >
                {UI_TEXT.DISCORD_MANAGER.BTN_REGISTER_SERVER}
              </button>
            </div>
          </div>

          {/* Discord Navigation Sub-tabs */}
          <nav className="nav-tabs">
            <button
              className={`tab-btn ${activeTab === DISCORD_TABS.DISCORD ? 'active' : ''}`}
              onClick={() => setActiveTab(DISCORD_TABS.DISCORD)}
            >
              {UI_TEXT.DISCORD_MANAGER.TAB_SERVERS_LABEL(servers.length)}
            </button>
            <button
              className={`tab-btn ${activeTab === DISCORD_TABS.COMMANDS ? 'active' : ''}`}
              onClick={() => setActiveTab(DISCORD_TABS.COMMANDS)}
            >
              {UI_TEXT.DISCORD_MANAGER.TAB_COMMANDS_LABEL}
            </button>
            <button
              className={`tab-btn ${activeTab === DISCORD_TABS.HEALTH ? 'active' : ''}`}
              onClick={() => setActiveTab(DISCORD_TABS.HEALTH)}
            >
              {UI_TEXT.DISCORD_MANAGER.TAB_HEALTH_LABEL}
            </button>
          </nav>

          {/* SUB-TAB 1: CONNECTED SERVERS */}
          {activeTab === DISCORD_TABS.DISCORD && (
            <div>
              {loading && (
                <p
                  style={{ color: 'var(--text-secondary)', padding: '1rem 0' }}
                >
                  {UI_TEXT.DISCORD_MANAGER.LOADING_SERVERS}
                </p>
              )}

              {!loading && servers.length === 0 && (
                <div className="empty-state">
                  <div className="empty-icon">🤖</div>
                  <h3>{UI_TEXT.DISCORD_MANAGER.EMPTY_TITLE}</h3>
                  <p
                    style={{
                      color: 'var(--text-secondary)',
                      marginBottom: '1.5rem',
                      marginTop: '0.5rem',
                    }}
                  >
                    {UI_TEXT.DISCORD_MANAGER.EMPTY_DESC}
                  </p>
                  <a
                    href={
                      inviteData?.inviteUrl || API_ENDPOINTS.FALLBACK_INVITE_URL
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-discord"
                  >
                    {UI_TEXT.DISCORD_MANAGER.EMPTY_BTN}
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
                          ? UI_TEXT.DISCORD_MANAGER.CARD_BOT_CONNECTED
                          : UI_TEXT.DISCORD_MANAGER.CARD_BOT_LEFT}
                      </span>

                      {server.botJoined !== false ? (
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDeleteServer(server.id)}
                        >
                          {UI_TEXT.DISCORD_MANAGER.CARD_BTN_REMOVE}
                        </button>
                      ) : (
                        <a
                          href={
                            inviteData?.inviteUrl ||
                            API_ENDPOINTS.FALLBACK_INVITE_URL
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-primary"
                        >
                          {UI_TEXT.DISCORD_MANAGER.CARD_BTN_RECONNECT}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUB-TAB 2: SLASH COMMANDS */}
          {activeTab === DISCORD_TABS.COMMANDS && (
            <div>
              <div className="card" style={{ marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1rem', color: '#a5b4fc' }}>
                  {UI_TEXT.DISCORD_MANAGER.COMMANDS_TITLE}
                </h3>
                <div className="command-list">
                  <div className="command-item">
                    <div>
                      <div className="command-name">
                        {UI_TEXT.DISCORD_MANAGER.COMMAND_PING_NAME}
                      </div>
                      <div className="command-desc">
                        {UI_TEXT.DISCORD_MANAGER.COMMAND_PING_DESC}
                      </div>
                    </div>
                    <span className="status-badge active">
                      {UI_TEXT.DISCORD_MANAGER.COMMAND_PING_STATUS}
                    </span>
                  </div>
                  <div
                    className="command-item"
                    style={{ opacity: 0.6, borderStyle: 'dashed' }}
                  >
                    <div>
                      <div className="command-name">
                        {UI_TEXT.DISCORD_MANAGER.COMMAND_DEDICATED_NAME}
                      </div>
                      <div className="command-desc">
                        {UI_TEXT.DISCORD_MANAGER.COMMAND_DEDICATED_DESC}
                      </div>
                    </div>
                    <span className="status-badge inactive">
                      {UI_TEXT.DISCORD_MANAGER.COMMAND_DEDICATED_STATUS}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 3: BACKEND HEALTH & TOAST PLAYGROUND */}
          {activeTab === DISCORD_TABS.HEALTH && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
              }}
            >
              {/* Interactive Toast Tester */}
              <div className="card">
                <h3 style={{ marginBottom: '0.5rem', color: '#a5b4fc' }}>
                  {UI_TEXT.DISCORD_MANAGER.PLAYGROUND_TITLE}
                </h3>
                <p
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.85rem',
                    marginBottom: '1.25rem',
                    lineHeight: 1.5,
                  }}
                >
                  {UI_TEXT.DISCORD_MANAGER.PLAYGROUND_DESC}
                </p>
                <div
                  style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}
                >
                  <button
                    className="btn btn-danger"
                    onClick={() =>
                      addToast(
                        MESSAGES.SIMULATED_ERROR,
                        'error',
                        TOAST_DEFAULT_TITLES.error,
                      )
                    }
                  >
                    {UI_TEXT.DISCORD_MANAGER.PLAYGROUND_BTN_ERROR}
                  </button>
                  <button
                    className="btn btn-discord"
                    onClick={() =>
                      addToast(
                        MESSAGES.SIMULATED_SUCCESS,
                        'success',
                        TOAST_DEFAULT_TITLES.success,
                      )
                    }
                  >
                    {UI_TEXT.DISCORD_MANAGER.PLAYGROUND_BTN_SUCCESS}
                  </button>
                  <button
                    className="btn btn-secondary"
                    style={{
                      borderColor: 'rgba(245, 158, 11, 0.5)',
                      color: '#fbbf24',
                    }}
                    onClick={() =>
                      addToast(
                        MESSAGES.SIMULATED_WARNING,
                        'warning',
                        TOAST_DEFAULT_TITLES.warning,
                      )
                    }
                  >
                    {UI_TEXT.DISCORD_MANAGER.PLAYGROUND_BTN_WARNING}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() =>
                      addToast(
                        MESSAGES.SIMULATED_INFO,
                        'info',
                        TOAST_DEFAULT_TITLES.info,
                      )
                    }
                  >
                    {UI_TEXT.DISCORD_MANAGER.PLAYGROUND_BTN_INFO}
                  </button>
                </div>
              </div>

              {/* OAuth Invite Data Card */}
              <div className="card">
                <h3 style={{ marginBottom: '0.5rem' }}>
                  {UI_TEXT.DISCORD_MANAGER.OAUTH_DATA_TITLE}
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
            <h2 style={{ marginBottom: '1rem' }}>{UI_TEXT.MODAL.TITLE}</h2>
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: '0.85rem',
                marginBottom: '1.5rem',
              }}
            >
              {UI_TEXT.MODAL.SUBTITLE}
            </p>
            <form onSubmit={handleRegisterServer}>
              <div className="form-group">
                <label className="form-label">
                  {UI_TEXT.MODAL.LABEL_GUILD_ID}
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={UI_TEXT.MODAL.PLACEHOLDER_GUILD_ID}
                  value={manualGuildId}
                  onChange={(e) => setManualGuildId(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">{UI_TEXT.MODAL.LABEL_NAME}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={UI_TEXT.MODAL.PLACEHOLDER_NAME}
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  {UI_TEXT.MODAL.LABEL_MEMBER_COUNT}
                </label>
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
                  {UI_TEXT.MODAL.BTN_CANCEL}
                </button>
                <button type="submit" className="btn btn-discord">
                  {UI_TEXT.MODAL.BTN_SUBMIT}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GLOBAL TOAST NOTIFICATIONS */}
      <div className="toast-container" aria-live="polite">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast-item toast-${toast.type}`}
            role="alert"
          >
            <div className="toast-icon">
              {toast.type === 'error' && '⚠️'}
              {toast.type === 'success' && '✅'}
              {toast.type === 'warning' && '⚡'}
              {toast.type === 'info' && 'ℹ️'}
            </div>
            <div className="toast-body">
              <div className="toast-title">{toast.title}</div>
              <div className="toast-message">{toast.message}</div>
            </div>
            <button
              className="toast-close-btn"
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss notification"
            >
              ✕
            </button>
            <div className="toast-progress-bar" />
          </div>
        ))}
      </div>
    </div>
  )
}
