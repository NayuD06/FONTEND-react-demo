import { useState, useEffect } from 'react'
import MessageList from './MessageList'
import ChatInput from './ChatInput'
import UserList from './UserList'
import {
  sendMessage,
  listenToMessages,
  addUser,
  removeUser,
  listenToUsers,
  addSystemMessage,
} from '../services/firebaseService'
import './Chat.css'

export default function Chat() {
  const [messages, setMessages] = useState([])
  const [users, setUsers] = useState([])
  const [username, setUsername] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [typing, setTyping] = useState('')
  const [currentUserId] = useState(`user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)

  // Initialize Firebase listeners
  useEffect(() => {
    if (!username) return

    // Add current user
    addUser(username, currentUserId)
    addSystemMessage(`${username} joined the chat`)
    setIsConnected(true)

    // Listen to messages
    const unsubscribeMessages = listenToMessages((msgs) => {
      setMessages(msgs)
    })

    // Listen to users
    const unsubscribeUsers = listenToUsers((usersList) => {
      setUsers(usersList)
    })

    // Cleanup
    return () => {
      unsubscribeMessages()
      unsubscribeUsers()
      removeUser(currentUserId)
      addSystemMessage(`${username} left the chat`)
    }
  }, [username, currentUserId])

  const handleJoin = (name) => {
    if (name.trim()) {
      setUsername(name)
    }
  }

  const handleSendMessage = (text) => {
    if (text.trim() && username) {
      sendMessage(username, text)
    }
  }

  const handleTyping = () => {
    // Firebase typing indicator can be added here if needed
  }

  const handleStopTyping = () => {
    // Firebase typing indicator can be added here if needed
  }

  // Join room UI
  if (!username) {
    return (
      <div className="join-container">
        <div className="join-box">
          <h1>💬 Chat App</h1>
          <p>Enter your name to start chatting</p>
          <input
            type="text"
            placeholder="Your name..."
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleJoin(e.target.value)
                e.target.value = ''
              }
            }}
            className="username-input"
          />
          <button
            onClick={(e) => {
              const input = e.target.previousElementSibling
              handleJoin(input.value)
              input.value = ''
            }}
            className="join-button"
          >
            Join Chat
          </button>
          <p className={`status ${isConnected ? 'connected' : 'connecting'}`}>
            {isConnected ? '🟢 Connected' : '🔴 Connecting...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="chat-wrapper">
      <UserList users={users} currentUser={username} />
      <div className="chat-container">
        <div className="chat-header">
          <div className="header-content">
            <h1>💬 Chat App</h1>
            <p>Users: {users.length}</p>
          </div>
          <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '🟢 Online' : '🔴 Offline'}
          </div>
        </div>

        <MessageList messages={messages} currentUser={username} typing={typing} />

        <ChatInput 
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
          onStopTyping={handleStopTyping}
        />
      </div>
    </div>
  )
}
