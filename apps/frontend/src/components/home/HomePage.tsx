import { APP_ROUTES } from '../../constants'

interface HomePageProps {
  onNavigate: (path: string) => void
}

export function HomePage({ onNavigate }: HomePageProps) {
  return (
    <main>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-badge">✨ Self-Hosted CRM Platform v1.0</div>
        <h1 className="hero-title">
          Manage Support Channels & Discord Integrations Seamlessly
        </h1>
        <p className="hero-subtitle">
          Angora is a modern self-hosted customer support CRM system with native
          integrations for Discord servers, Slack channels, and email automated
          workflows.
        </p>
        <div className="hero-cta-group">
          <button
            className="btn btn-discord"
            style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }}
            onClick={() => onNavigate(APP_ROUTES.DISCORD_BOT)}
          >
            🎮 Open Discord Manager (/discordbot) →
          </button>
        </div>
      </section>

      {/* Features Overview Section */}
      <section className="features-section">
        <div className="section-header">
          <h2 className="section-title">Integrated Apps & Modules</h2>
          <p className="section-subtitle">
            Click any module to manage its gateway connection and live status
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
                View active Discord servers, manage bot OAuth invitation links,
                track member stats, and execute slash commands (/ping).
              </p>
            </div>
            <button
              className="btn btn-discord"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => onNavigate(APP_ROUTES.DISCORD_BOT)}
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
                Connect support agents with customer support channels, receive
                ticket updates, and automate workspace notifications.
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
              onClick={() => onNavigate(APP_ROUTES.DISCORD_BOT)}
            >
              View Connected Records
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}
