import './Message.css'

export default function Message({ message, currentUser }) {
  const isSystem = message.isSystem
  
  if (isSystem) {
    return (
      <div className="message system-message">
        <p className="system-text">{message.text}</p>
      </div>
    )
  }

  const time = message.timestamp 
    ? new Date(message.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    : ''

  const isCurrentUser = message.username === currentUser

  return (
    <div className={`message ${isCurrentUser ? 'user-message' : 'other-message'}`}>
      {!isCurrentUser && (
        <div className="sender-info">
          <span className="sender-avatar">👤</span>
          <span className="sender-name">{message.username}</span>
        </div>
      )}
      <div className="message-content">
        <p>{message.text}</p>
        <span className="message-time">{time}</span>
      </div>
    </div>
  )
}
