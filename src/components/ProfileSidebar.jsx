import './ProfileSidebar.css'

const attachmentTypes = ['PDF', 'VIDEO', 'MP3', 'IMAGE']

const toSafeText = (value, fallback = '') => {
  if (typeof value === 'string') return value
  if (value === null || value === undefined) return fallback
  return String(value)
}

const getInitials = (name = '') => {
  const safeName = toSafeText(name, '').trim()
  const parts = safeName.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'GC'
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('')
}

export default function ProfileSidebar({ activeContact, usersCount, users = [], onLogout }) {
  const contactName = toSafeText(activeContact?.username, 'General Chat')
  const onlineUsers =
    users.length > 0
      ? users.map((user, index) => ({
          socketId: user?.socketId || `safe-${index}`,
          username: toSafeText(user?.username, 'User'),
        }))
      : [{ socketId: 'self', username: 'You' }]

  return (
    <aside className="profile-sidebar" aria-label="Contact profile panel">
      <div className="profile-avatar">{getInitials(contactName)}</div>
      <h3>{contactName}</h3>
      <p>{activeContact ? 'Teammate' : 'Group Conversation'}</p>

      <div className="profile-actions" role="group" aria-label="Quick actions">
        <button type="button">Chat</button>
        <button type="button">Call</button>
      </div>

      <div className="profile-stats">
        <div>
          <span>Online now</span>
          <strong>{usersCount}</strong>
        </div>
        <div>
          <span>Files</span>
          <strong>4</strong>
        </div>
      </div>

      <div className="profile-attachments">
        <h4>Online users</h4>
        <div className="online-users-list">
          {onlineUsers.length > 0 ? (
            onlineUsers.map((user) => (
              <div className="online-user-item" key={user.socketId}>
                <span className="online-dot" aria-hidden="true"></span>
                <span>{user.username}</span>
              </div>
            ))
          ) : (
            <p className="online-empty">No one online right now</p>
          )}
        </div>
      </div>

      <div className="profile-attachments">
        <h4>Attachments</h4>
        <div className="attachment-list">
          {attachmentTypes.map((type) => (
            <button type="button" key={type}>
              {type}
            </button>
          ))}
        </div>
      </div>

      <button className="logout-side-button" type="button" onClick={onLogout}>
        Sign out
      </button>
    </aside>
  )
}
