import { useEffect, useRef } from 'react'
import Message from './Message'
import './MessageList.css'

export default function MessageList({ messages, currentUser, typing }) {
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  return (
    <div className="message-list">
      {messages.length === 0 ? (
        <div className="empty-state">
          <h2>💬 Welcome to Chat</h2>
          <p>Start a conversation!</p>
        </div>
      ) : (
        messages.map((msg, index) => (
          <Message 
            key={msg.id || `${msg.username || 'system'}-${msg.timestamp || index}`} 
            message={msg} 
            currentUser={currentUser}
          />
        ))
      )}
      
      {typing && (
        <div className="typing-indicator">
          <p><strong>{typing}</strong> is typing</p>
          <div className="typing-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      )}
      
      <div ref={endRef} />
    </div>
  )
}
