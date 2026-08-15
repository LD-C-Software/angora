import { APP_ROUTES } from '../../constants'

interface HeaderProps {
  currentPath: string
  onNavigate: (path: string) => void
}

export function Header({ currentPath, onNavigate }: HeaderProps) {
  return (
    <header className="app-header">
      <div
        className="brand-logo"
        style={{ cursor: 'pointer' }}
        onClick={() => onNavigate(APP_ROUTES.HOME)}
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
          className={`nav-link ${currentPath === APP_ROUTES.HOME ? 'active' : ''}`}
          onClick={() => onNavigate(APP_ROUTES.HOME)}
        >
          🏠 Home
        </button>
        <button
          className={`nav-link nav-btn-discord ${currentPath === APP_ROUTES.DISCORD_BOT ? 'active' : ''}`}
          onClick={() => onNavigate(APP_ROUTES.DISCORD_BOT)}
        >
          🎮 Discord Bot
        </button>
      </nav>
    </header>
  )
}
