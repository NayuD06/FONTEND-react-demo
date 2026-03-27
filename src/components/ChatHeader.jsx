import './ChatHeader.css'

export default function ChatHeader({ usersCount, isConnected, error, currentUserLabel, onLogout }) {
  return (
    <div className="chat-header">
      <div className="header-content">
        <h1>Chat App</h1>
        <p>{currentUserLabel} • Users: {usersCount}</p>
        {error && <p className="header-error">{error}</p>}
      </div>

      <div className="header-actions">
        <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? 'Online' : 'Offline'}
        </div>
        <button className="logout-button" onClick={onLogout}>
          Logout
        </button>
      </div>
    </div>
  )
}
