import { useEffect, useMemo, useRef, useState } from 'react'
import Message from './Message'
import './MessageList.css'

const SYSTEM_MESSAGE_VISIBLE_MS = 4500

export default function MessageList({ messages, currentUser, typing, hasSelectedContact }) {
  const endRef = useRef(null)
  const [clock, setClock] = useState(Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => {
      setClock(Date.now())
    }, 1000)

    return () => {
      window.clearInterval(timer)
    }
  }, [])

  const visibleMessages = useMemo(() => {
    return messages.filter((message) => {
      if (!message?.isSystem) return true
      const timestamp = Number(message?.timestamp || 0)
      if (!timestamp) return false
      return clock - timestamp <= SYSTEM_MESSAGE_VISIBLE_MS
    })
  }, [messages, clock])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [visibleMessages, typing])

  return (
    <div className="message-list">
      {visibleMessages.length === 0 ? (
        <div className="empty-state">
          <h2>💬 Direct Chat</h2>
          <p>{hasSelectedContact ? 'Start a conversation!' : 'Select a user to start chatting.'}</p>
        </div>
      ) : (
        visibleMessages.map((msg, index) => (
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
