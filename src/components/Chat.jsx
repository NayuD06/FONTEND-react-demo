import { useState, useEffect } from 'react'
import ChatHeader from './ChatHeader'
import MessageList from './MessageList'
import ChatInput from './ChatInput'
import UserList from './UserList'
import ProfileSidebar from './ProfileSidebar'
import {
  addUser,
  getFirebaseConfigError,
  listenToMessages,
  listenToUsers,
  removeUser,
  sendMessage,
  touchUserActivity,
} from '../services/firebaseService'
import { fetchAllUserProfiles, sendChatMessage } from '../services/chatApiService'
import './Chat.css'

const resolveTheme = () => {
  const storedTheme = localStorage.getItem('chatTheme')
  return storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : 'dark'
}

const toSafeText = (value, fallback = '') => {
  if (typeof value === 'string') return value
  if (value === null || value === undefined) return fallback
  return String(value)
}

export default function Chat({ currentUser, onLogout, authError }) {
  const [messages, setMessages] = useState([])
  const [users, setUsers] = useState([])
  const [mongoUsers, setMongoUsers] = useState([])
  const [selectedUsers, setSelectedUsers] = useState([])
  const [selectedContact, setSelectedContact] = useState('')
  const [theme, setTheme] = useState(resolveTheme)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState('')

  const currentUserId = currentUser?.uid || ''
  const username = toSafeText(
    currentUser?.displayName || currentUser?.email?.split('@')[0],
    'User',
  )
  const configError = getFirebaseConfigError()
  const error = connectionError || authError || configError
  const typing = ''
  const safeMessages = messages.map((message, index) => ({
    ...message,
    id: toSafeText(message?.id, `safe-msg-${index}`),
    username: toSafeText(message?.username, ''),
    recipient: toSafeText(message?.recipient, ''),
    text: toSafeText(message?.text, ''),
    timestamp: Number(message?.timestamp || 0),
  }))
  const normalizedUsers = users
    .map((user) => ({
      socketId: toSafeText(user?.socketId, ''),
      username: toSafeText(user?.username, '').trim(),
      status: toSafeText(user?.status, 'online'),
      lastActive: Number(user?.lastActive || user?.timestamp || 0),
    }))
    .filter((user) => user.socketId && user.username)

  const onlineUsers =
    normalizedUsers.some((user) => user.socketId === currentUserId) || !currentUserId
      ? normalizedUsers
      : [
          ...normalizedUsers,
          {
            socketId: currentUserId,
            username,
            status: 'online',
            lastActive: Date.now(),
          },
        ]

  const normalizedMongoUsers = mongoUsers
    .map((user) => {
      const displayName = toSafeText(user?.displayName, '').trim()
      const emailName = toSafeText(user?.email, '').split('@')[0] || ''
      const userLabel = displayName || emailName || toSafeText(user?.firebaseUid, '').slice(0, 8)

      return {
        id: toSafeText(user?.id, toSafeText(user?.firebaseUid, userLabel)),
        username: userLabel,
        firebaseUid: toSafeText(user?.firebaseUid, ''),
      }
    })
    .filter((user) => user.username && user.firebaseUid !== currentUserId)

  const normalizedFirebaseUsers = onlineUsers
    .map((user) => ({
      id: toSafeText(user?.socketId, ''),
      username: toSafeText(user?.username, '').trim(),
      firebaseUid: toSafeText(user?.socketId, ''),
      isOnline: true,
      lastActive: Number(user?.lastActive || 0),
    }))
    .filter((user) => user.username && user.firebaseUid && user.firebaseUid !== currentUserId)

  const mergedUsersMap = new Map()
  normalizedMongoUsers.forEach((user) => {
    mergedUsersMap.set(user.firebaseUid, {
      ...user,
      isOnline: false,
      lastActive: 0,
    })
  })
  normalizedFirebaseUsers.forEach((user) => {
    const existed = mergedUsersMap.get(user.firebaseUid)
    mergedUsersMap.set(user.firebaseUid, {
      ...(existed || {}),
      ...user,
      username: user.username || existed?.username || '',
      isOnline: true,
      lastActive: user.lastActive,
    })
  })

  const directoryUsers = [...mergedUsersMap.values()].sort((a, b) => {
    if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1
    return (b.lastActive || 0) - (a.lastActive || 0)
  })

  const selectedUserSet = new Set(selectedUsers)
  const contacts = directoryUsers.filter((user) => selectedUserSet.has(user.username))
  const availableUsers = directoryUsers.filter((user) => !selectedUserSet.has(user.username))
  const selectedContactData = contacts.find((user) => user.username === selectedContact) || null
  const activeContactName = toSafeText(selectedContactData?.username, 'General chat room')
  const conversationMessages = safeMessages.filter((message) => {
    if (message.isSystem) return false
    if (!selectedContact) return false

    const isInbound = message.username === selectedContact && message.recipient === username
    const isOutbound = message.username === username && message.recipient === selectedContact

    return isInbound || isOutbound
  })

  useEffect(() => {
    const normalizedTheme = theme === 'light' || theme === 'dark' ? theme : 'dark'
    if (normalizedTheme !== theme) {
      setTheme(normalizedTheme)
      return
    }
    localStorage.setItem('chatTheme', normalizedTheme)
  }, [theme])

  useEffect(() => {
    if (selectedContact && contacts.some((user) => user.username === selectedContact)) {
      return
    }

    if (contacts.length > 0) {
      setSelectedContact(contacts[0].username)
      return
    }

    setSelectedContact('')
  }, [contacts, selectedContact])

  useEffect(() => {
    if (!currentUserId) return

    let isMounted = true

    const loadMongoUsers = async () => {
      try {
        const profiles = await fetchAllUserProfiles()
        if (!isMounted) return
        setMongoUsers(Array.isArray(profiles) ? profiles : [])
      } catch {
        if (isMounted) setMongoUsers([])
      }
    }

    loadMongoUsers()
    const intervalId = window.setInterval(loadMongoUsers, 10000)

    return () => {
      isMounted = false
      window.clearInterval(intervalId)
    }
  }, [currentUserId])

  useEffect(() => {
    if (selectedUsers.length > 0) return
    if (directoryUsers.length === 0) return

    setSelectedUsers([directoryUsers[0].username])
  }, [directoryUsers, selectedUsers.length])

  const toFriendlyError = (err) => {
    const message = err?.message || ''
    if (!message) return 'Không thể kết nối Firebase Realtime Database.'
    if (message.includes('permission_denied')) {
      return 'Tài khoản chưa được cấp quyền sử dụng chat trên Firebase.'
    }
    if (message.includes('Cau hinh Firebase chua day du')) return message
    return message
  }

  useEffect(() => {
    if (!username || !currentUserId) return
    if (configError) {
      return
    }

    let isMounted = true

    const bootstrap = async () => {
      try {
        await addUser(username, currentUserId)
        await touchUserActivity(currentUserId)
        if (!isMounted) return
        setIsConnected(true)
        setConnectionError('')
      } catch (err) {
        if (isMounted) {
          setConnectionError(toFriendlyError(err))
          setIsConnected(false)
        }
      }
    }

    const unsubscribeMessages = listenToMessages(
      (messagesData) => {
        if (isMounted) setMessages(messagesData)
      },
      (err) => {
        if (isMounted) {
          setConnectionError(toFriendlyError(err))
          setIsConnected(false)
        }
      }
    )

    const unsubscribeUsers = listenToUsers(
      (usersData) => {
        if (isMounted) setUsers(usersData)
      },
      (err) => {
        if (isMounted) {
          setConnectionError(toFriendlyError(err))
          setIsConnected(false)
        }
      }
    )

    bootstrap()

    return () => {
      isMounted = false
      unsubscribeMessages()
      unsubscribeUsers()
      removeUser(currentUserId).catch(() => {})
    }
  }, [username, currentUserId, configError])

  useEffect(() => {
    if (!currentUserId) return

    let heartbeatId = null

    const markActivity = () => {
      touchUserActivity(currentUserId).catch(() => {})
    }

    const markLogoutOnPageExit = () => {
      localStorage.setItem('chatLogoutReason', 'Bạn đã đăng xuất vì rời khỏi trang web.')
    }

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click']
    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, markActivity, { passive: true })
    })

    window.addEventListener('beforeunload', markLogoutOnPageExit)
    window.addEventListener('pagehide', markLogoutOnPageExit)

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        markActivity()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    markActivity()
    heartbeatId = window.setInterval(() => {
      touchUserActivity(currentUserId).catch(() => {})
    }, 60 * 1000)

    return () => {
      if (heartbeatId) window.clearInterval(heartbeatId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', markLogoutOnPageExit)
      window.removeEventListener('pagehide', markLogoutOnPageExit)
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, markActivity)
      })
    }
  }, [currentUserId, username])

  const handleSendMessage = async (text) => {
    if (!selectedContact) return

    if (text.trim() && username) {
      try {
        await sendMessage(username, text, selectedContact, currentUserId)
      } catch (err) {
        setConnectionError(toFriendlyError(err))
        setIsConnected(false)
        return
      }

      try {
        // Best-effort Mongo sync. Never break realtime chat delivery when API is missing.
        await sendChatMessage(username, text)
      } catch (err) {
        const message = err?.message || ''
        const backendUnavailable =
          message.includes('VITE_API_BASE_URL') ||
          message.includes('Không kết nối được API chat') ||
          message.includes('localhost')

        if (!backendUnavailable) {
          setConnectionError(`Đã gửi realtime nhưng chưa lưu Mongo: ${message}`)
        }
      }
    }
  }

  const handleTyping = () => {
    // Firebase typing indicator can be added here if needed
  }

  const handleStopTyping = () => {
    // Firebase typing indicator can be added here if needed
  }

  const handleAddUser = (usernameToAdd) => {
    const safeName = toSafeText(usernameToAdd, '').trim()
    if (!safeName) return

    setSelectedUsers((prev) => {
      if (prev.includes(safeName)) return prev
      return [...prev, safeName]
    })

    setSelectedContact(safeName)
  }

  const handleRemoveUser = (usernameToRemove) => {
    setSelectedUsers((prev) => prev.filter((item) => item !== usernameToRemove))
    setSelectedContact((prev) => (prev === usernameToRemove ? '' : prev))
  }

  return (
    <div className={`chat-shell theme-${theme}`}>
      <div className="chat-wrapper">
        <UserList
          users={contacts}
          availableUsers={availableUsers}
          currentUser={username}
          selectedContact={selectedContact}
          onSelectContact={setSelectedContact}
          onAddUser={handleAddUser}
          onRemoveUser={handleRemoveUser}
          onLogout={onLogout}
          theme={theme}
          onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
        />

        <div className="chat-container">
        <ChatHeader
          activeContactName={activeContactName}
          usersCount={contacts.length}
          isConnected={isConnected}
          error={error}
          currentUserLabel={`Signed in as ${username}`}
        />

          <MessageList
            messages={conversationMessages}
            currentUser={username}
            typing={typing}
            hasSelectedContact={Boolean(selectedContact)}
          />

          <ChatInput
            onSendMessage={handleSendMessage}
            onTyping={handleTyping}
            onStopTyping={handleStopTyping}
            disabled={!selectedContact}
          />
        </div>

        <ProfileSidebar
          activeContact={selectedContactData}
          usersCount={onlineUsers.length}
          users={onlineUsers}
          onLogout={onLogout}
        />
      </div>
    </div>
  )
}
