import { useMemo, useState } from 'react'
import './UserList.css'

const toSafeText = (value, fallback = '') => {
  if (typeof value === 'string') return value
  if (value === null || value === undefined) return fallback
  return String(value)
}

const getInitials = (name = '') => {
  const safeName = toSafeText(name, '').trim()
  const words = safeName.split(/\s+/).filter(Boolean)
  if (!words.length) return 'U'
  return words.slice(0, 2).map((word) => word[0]?.toUpperCase() || '').join('')
}

export default function UserList({
  users,
  availableUsers,
  currentUser,
  selectedContact,
  onSelectContact,
  onAddUser,
  onRemoveUser,
  onLogout,
  theme,
  onToggleTheme,
}) {
  const [query, setQuery] = useState('')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const safeCurrentUser = toSafeText(currentUser, 'You')

  const contacts = useMemo(() => {
    const onlineByName = new Map()
    users.forEach((user) => {
      const username = toSafeText(user?.username, '').trim()
      if (!username || username === safeCurrentUser) return
      onlineByName.set(username, {
        socketId: toSafeText(user?.socketId, `user-${username}`),
        username,
        isOnline: Boolean(user?.isOnline),
        lastActive: Number(user?.lastActive || 0),
      })
    })

    return [...onlineByName.values()].sort((a, b) => b.lastActive - a.lastActive)
  }, [users, safeCurrentUser])

  const filteredContacts = useMemo(() => {
    const keyword = toSafeText(query, '').trim().toLowerCase()
    if (!keyword) return contacts
    return contacts.filter((user) => toSafeText(user?.username, '').toLowerCase().includes(keyword))
  }, [contacts, query])

  const filteredAvailableUsers = useMemo(() => {
    const keyword = toSafeText(query, '').trim().toLowerCase()
    if (!keyword) return availableUsers
    return availableUsers.filter((user) =>
      toSafeText(user?.username, '').toLowerCase().includes(keyword),
    )
  }, [availableUsers, query])

  return (
    <aside className="user-list-sidebar">
      <div className="sidebar-rail" aria-label="Main navigation">
        <div className="rail-top">
          <span className="rail-logo">D</span>
          <button type="button" className="rail-btn active" aria-label="Home">
            ⌂
          </button>
          <button type="button" className="rail-btn" aria-label="Search">
            ⌕
          </button>
          <button type="button" className="rail-btn" aria-label="Saved">
            □
          </button>
          <button type="button" className="rail-btn" aria-label="Share">
            ◇
          </button>
        </div>

        <div className="rail-bottom">
          <button
            type="button"
            className="rail-btn"
            aria-label="Toggle theme"
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
          <div className="rail-self-avatar">{getInitials(safeCurrentUser)}</div>
        </div>
      </div>

      <div className="sidebar-main">
        <div className="sidebar-profile">
          <div className="sidebar-profile-avatar">{getInitials(safeCurrentUser)}</div>
          <div>
            <h3>{safeCurrentUser}</h3>
            <p>Online</p>
          </div>
          <button className="logout-mini" type="button" onClick={onLogout}>
            Out
          </button>
        </div>

        <div className="sidebar-search">
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search"
            aria-label="Search users"
          />
        </div>

        <div className="section-title-row">
          <h4>Users</h4>
          <div className="section-actions">
            <span>{filteredContacts.length}</span>
            <button
              type="button"
              className="add-user-btn"
              onClick={() => setIsAddOpen((prev) => !prev)}
            >
              Add User
            </button>
          </div>
        </div>

        {isAddOpen && (
          <div className="add-user-dropdown">
            {filteredAvailableUsers.length > 0 ? (
              filteredAvailableUsers.map((user) => (
                <button
                  key={user.id || user.socketId || user.username}
                  type="button"
                  className="add-user-item"
                  onClick={() => {
                    onAddUser(user.username)
                    setIsAddOpen(false)
                  }}
                >
                  {user.username}
                </button>
              ))
            ) : (
              <p className="add-user-empty">No more users to add</p>
            )}
          </div>
        )}

        <div className="users-scroll">
          {filteredContacts.map((user) => (
            <button
              key={user.socketId}
              type="button"
              className={`user-item ${selectedContact === user.username ? 'active' : ''}`}
              onClick={() => onSelectContact(user.username)}
            >
              <span className="user-avatar">{getInitials(user.username)}</span>
              <span className="user-main">
                <span className="user-row">
                  <span className="user-name">{user.username}</span>
                  <span className={`user-presence ${user.isOnline ? 'online' : 'offline'}`}>
                    {user.isOnline ? 'online' : 'offline'}
                  </span>
                </span>
              </span>
                <button
                  type="button"
                  className="remove-user-btn"
                  onClick={(event) => {
                    event.stopPropagation()
                    onRemoveUser(user.username)
                  }}
                >
                  x
                </button>
            </button>
          ))}
        </div>

        {filteredContacts.length === 0 && (
          <div className="no-users">
            <p>No users online</p>
          </div>
        )}
      </div>
    </aside>
  )
}
