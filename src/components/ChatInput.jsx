import { useState } from 'react'
import './ChatInput.css'

export default function ChatInput({ onSendMessage, onTyping, onStopTyping }) {
  const [input, setInput] = useState('')

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input)
      setInput('')
      onStopTyping && onStopTyping()
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleChange = (e) => {
    setInput(e.target.value)
    if (onTyping && e.target.value.trim()) {
      onTyping()
    }
  }

  return (
    <div className="chat-input-container">
      <textarea
        value={input}
        onChange={handleChange}
        onKeyDown={handleKeyPress}
        onBlur={() => onStopTyping && onStopTyping()}
        placeholder="Type your message here..."
        className="chat-input"
        rows="3"
      />
      <button 
        onClick={handleSend}
        className="send-button"
        disabled={!input.trim()}
      >
        <span>Send</span>
        <span className="send-icon">→</span>
      </button>
    </div>
  )
}
