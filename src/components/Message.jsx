import './Message.css'

export default function Message({ message, isUser, currentUser }) {
  const isSystem = message.isSystem
  
  if (isSystem) {
    return (
      <div className="message system-message">
        <p className="system-text">{message.text}</p>
      </div>
    )
  }

  return (
    <div className={`message ${isUser ? 'user-message' : 'other-message'}`}>
      {!isUser && (
        <div className="sender-info">
          <span className="sender-avatar">👤</span>
          <span className="sender-name">{message.username}</span>
        </div>
      )}
      <div className="message-content">
        <p>{message.text}</p>
        <span className="message-time">{message.time}</span>
      </div>
    </div>
  )
}
