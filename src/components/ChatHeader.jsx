import './ChatHeader.css'

const toSafeText = (value, fallback = '') => {
  if (typeof value === 'string') return value
  if (value === null || value === undefined) return fallback
  return String(value)
}

const getInitials = (name = '') => {
  const safeName = toSafeText(name, '').trim()
  const parts = safeName.split(/\s+/).filter(Boolean)
  if (!parts.length) return 'GC'
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('')
}

export default function ChatHeader({ activeContactName, usersCount, isConnected, error, currentUserLabel }) {
  const safeContactName = toSafeText(activeContactName, 'General chat room')
  const safeCurrentUserLabel = toSafeText(currentUserLabel, '')

  return (
    <header className="chat-header">
      <div className="chat-header-contact">
        <div className="contact-avatar">{getInitials(safeContactName)}</div>
        <div className="header-content">
          <h1>{safeContactName}</h1>
          <p>{safeCurrentUserLabel}</p>
          {error && <p className="header-error">{error}</p>}
        </div>
      </div>

      <div className="header-actions">
        <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? 'Online' : 'Offline'}
        </div>
        <span className="header-meta">{usersCount} active</span>
        <button type="button" aria-label="Search conversation" className="header-icon-button">
          ⌕
        </button>
        <button type="button" aria-label="Open notifications" className="header-icon-button">
          ☎
        </button>
      </div>
    </header>
  )
}
