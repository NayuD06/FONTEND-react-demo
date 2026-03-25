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
  getFirebaseConfigError,
} from '../services/firebaseService'
import './Chat.css'

export default function Chat() {
  const [messages, setMessages] = useState([])
  const [users, setUsers] = useState([])
  const [username, setUsername] = useState('')
  const [joinName, setJoinName] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [typing, setTyping] = useState('')
  const [error, setError] = useState('')
  const [currentUserId] = useState(`user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)

  const toFriendlyError = (err) => {
    const message = err?.message || ''

    if (message.includes('permission_denied')) {
      return 'Firebase khong co quyen doc/ghi. Hay vao Realtime Database > Rules va cho phep read/write.'
    }

    if (message.includes('Cau hinh Firebase chua day du')) {
      return message
    }

    return 'Khong the ket noi Firebase Realtime Database. Hay kiem tra lai DATABASE_URL va da tao database instance chua.'
  }

  // Initialize Firebase listeners
  useEffect(() => {
    if (!username) return

    const configError = getFirebaseConfigError()
    if (configError) {
      setError(configError)
      setIsConnected(false)
      return
    }

    let isMounted = true
    setError('')
    setIsConnected(false)

    // Add current user
    Promise.all([
      addUser(username, currentUserId),
      addSystemMessage(`${username} joined the chat`),
    ])
      .then(() => {
        if (isMounted) {
          setIsConnected(true)
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(toFriendlyError(err))
          setIsConnected(false)
        }
      })

    // Listen to messages
    const unsubscribeMessages = listenToMessages((msgs) => {
      setMessages(msgs)
    }, (err) => {
      if (isMounted) {
        setError(toFriendlyError(err))
        setIsConnected(false)
      }
    })

    // Listen to users
    const unsubscribeUsers = listenToUsers((usersList) => {
      setUsers(usersList)
    }, (err) => {
      if (isMounted) {
        setError(toFriendlyError(err))
        setIsConnected(false)
      }
    })

    // Cleanup
    return () => {
      isMounted = false
      unsubscribeMessages()
      unsubscribeUsers()
      removeUser(currentUserId)
      addSystemMessage(`${username} left the chat`)
    }
  }, [username, currentUserId])

  const handleJoin = (name) => {
    if (name.trim()) {
      setError('')
      setUsername(name)
    }
  }

  const handleSendMessage = async (text) => {
    if (text.trim() && username) {
      try {
        await sendMessage(username, text)
      } catch (err) {
        setError(toFriendlyError(err))
        setIsConnected(false)
      }
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
            value={joinName}
            onChange={(e) => setJoinName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleJoin(joinName)
                setJoinName('')
              }
            }}
            className="username-input"
          />
          <button
            onClick={() => {
              handleJoin(joinName)
              setJoinName('')
            }}
            className="join-button"
          >
            Join Chat
          </button>
          {error && <p className="status error">{error}</p>}
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
            {error && <p className="header-error">{error}</p>}
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
