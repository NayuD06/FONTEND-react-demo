import './UserList.css'

export default function UserList({ users, currentUser }) {
  return (
    <div className="user-list-sidebar">
      <div className="sidebar-header">
        <h3>👥 Users</h3>
        <span className="user-count">{users.length}</span>
      </div>
      
      <div className="users-scroll">
        {users.map((user) => (
          <div key={user.socketId} className="user-item">
            <span className="user-status">🟢</span>
            <span className="user-name">
              {user.username}
              {user.username === currentUser && <span className="you">(You)</span>}
            </span>
          </div>
        ))}
      </div>

      {users.length === 0 && (
        <div className="no-users">
          <p>No users yet</p>
        </div>
      )}
    </div>
  )
}
