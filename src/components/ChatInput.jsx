import { useState } from 'react'
import './ChatInput.css'

export default function ChatInput({ onSendMessage, onTyping, onStopTyping, disabled = false }) {
  const [input, setInput] = useState('')

  const handleSend = () => {
    if (disabled) return

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
    if (!disabled && onTyping && e.target.value.trim()) {
      onTyping()
    }
  }

  return (
    <div className="chat-input-container">
      <button type="button" className="composer-tool" aria-label="Voice note">
        ☺
      </button>

      <input
        value={input}
        onChange={handleChange}
        onKeyDown={handleKeyPress}
        onBlur={() => onStopTyping && onStopTyping()}
        placeholder={disabled ? 'Select a user to chat' : 'Message........'}
        className="chat-input"
        disabled={disabled}
      />

      <button type="button" className="composer-tool" aria-label="Attach file">
        📎
      </button>

      <button type="button" className="composer-tool" aria-label="Open sticker panel">
        🖼
      </button>

      <button onClick={handleSend} className="send-button" disabled={disabled || !input.trim()} type="button">
        ➤
      </button>
    </div>
  )
}
