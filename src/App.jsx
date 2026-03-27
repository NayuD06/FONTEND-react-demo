import { useEffect, useState } from 'react'
import AuthForm from './components/AuthForm'
import Chat from './components/Chat'
import {
  loginWithEmail,
  logoutUser,
  onAuthChanged,
  registerWithEmail,
} from './services/authService'
import { upsertUserProfile } from './services/chatApiService'
import './App.css'

function App() {
  const [currentUser, setCurrentUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [authError, setAuthError] = useState('')
  const [isRegisterMode, setIsRegisterMode] = useState(false)

  const toFriendlyAuthError = (error) => {
    const code = error?.code || ''
    const message = error?.message || ''

    if (message.includes('Cau hinh Firebase chua day du')) {
      return message
    }

    if (code.includes('auth/operation-not-allowed')) {
      return 'Phương thức Email/Password chưa được bật trong Firebase Authentication > Sign-in method.'
    }
    if (code.includes('auth/configuration-not-found')) {
      return 'Firebase Authentication chưa sẵn sàng. Hãy vào Firebase Console > Authentication: (1) bật Authentication cho project, (2) bật Email/Password trong Sign-in method, (3) kiểm tra apiKey/authDomain đúng project.'
    }
    if (code.includes('auth/invalid-api-key')) {
      return 'API key Firebase không hợp lệ. Hãy kiểm tra VITE_FIREBASE_API_KEY trong file .env.'
    }
    if (code.includes('auth/app-not-authorized')) {
      return 'Domain hiện tại chưa được cấp quyền. Hãy thêm domain vào Firebase Authentication > Settings > Authorized domains.'
    }
    if (code.includes('auth/network-request-failed')) {
      return 'Không kết nối được tới Firebase. Hãy kiểm tra mạng hoặc cấu hình firewall/proxy.'
    }
    if (code.includes('auth/too-many-requests')) {
      return 'Bạn thử sai quá nhiều lần. Vui lòng đợi một lúc rồi thử lại.'
    }

    if (code.includes('auth/invalid-email')) return 'Email không hợp lệ.'
    if (code.includes('auth/user-not-found')) return 'Không tìm thấy tài khoản.'
    if (code.includes('auth/wrong-password') || code.includes('auth/invalid-credential')) {
      return 'Email hoặc mật khẩu không đúng.'
    }
    if (code.includes('auth/email-already-in-use')) return 'Email này đã được sử dụng.'
    if (code.includes('auth/weak-password')) return 'Mật khẩu tối thiểu 6 ký tự.'

    return code
      ? `Không thể xác thực tài khoản (${code}). Hãy kiểm tra cấu hình Firebase Authentication.`
      : 'Không thể xác thực tài khoản. Hãy kiểm tra lại cấu hình Firebase Authentication.'
  }

  useEffect(() => {
    const unsubscribe = onAuthChanged(async (user) => {
      setCurrentUser(user)
      setAuthLoading(false)

      if (!user) return

      try {
        await upsertUserProfile({
          firebaseUid: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
        })
        setAuthError('')
      } catch {
        setAuthError('Đăng nhập thành công nhưng chưa lưu được hồ sơ user vào MongoDB.')
      }
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const handleAuthSubmit = async ({ email, password, displayName }) => {
    setAuthError('')
    try {
      if (isRegisterMode) {
        await registerWithEmail(email, password, displayName)
      } else {
        await loginWithEmail(email, password)
      }
    } catch (error) {
      setAuthError(toFriendlyAuthError(error))
    }
  }

  const handleLogout = async () => {
    setAuthError('')
    try {
      await logoutUser()
    } catch (error) {
      setAuthError(toFriendlyAuthError(error))
    }
  }

  if (authLoading) {
    return (
      <div className="app-loading">
        <h2>Đang tải...</h2>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <AuthForm
        isRegisterMode={isRegisterMode}
        onSubmit={handleAuthSubmit}
        onToggleMode={() => {
          setAuthError('')
          setIsRegisterMode((prev) => !prev)
        }}
        error={authError}
      />
    )
  }

  return (
    <Chat currentUser={currentUser} onLogout={handleLogout} authError={authError} />
  )
}

export default App
