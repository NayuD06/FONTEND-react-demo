import { useEffect, useRef, useState } from 'react'
import AuthForm from './components/AuthForm'
import Chat from './components/Chat'
import {
  deleteAuthUser,
  loginWithEmail,
  logoutUser,
  onAuthChanged,
  registerWithEmail,
} from './services/authService'
import { checkApiReady, fetchUserProfile, upsertUserProfile } from './services/chatApiService'
import { removeProvisionedUserAccess, setProvisionedUserAccess } from './services/firebaseService'
import './App.css'

function App() {
  const [currentUser, setCurrentUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [authError, setAuthError] = useState('')
  const [isRegisterMode, setIsRegisterMode] = useState(false)
  const authSubmitInProgressRef = useRef(false)

  const toFriendlyAuthError = (error) => {
    if (typeof error === 'string' && error.trim()) {
      return error
    }

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
    if (code.includes('auth/user-not-found')) {
      return 'Tài khoản chưa được tạo. Bạn chưa thể vào trang chat.'
    }
    if (code.includes('auth/wrong-password') || code.includes('auth/invalid-credential')) {
      return 'Email hoặc mật khẩu không đúng.'
    }
    if (code.includes('auth/invalid-login-credentials')) {
      return 'Email hoặc mật khẩu không đúng. Nếu tài khoản đã tạo trước đó, hãy dùng đúng mật khẩu cũ để hoàn tất đồng bộ.'
    }
    if (code.includes('auth/email-already-in-use')) return 'Email này đã được sử dụng.'
    if (code.includes('auth/weak-password')) return 'Mật khẩu tối thiểu 6 ký tự.'
    if (code.includes('auth/profile-not-found')) {
      return 'Tài khoản này chưa được tạo trong hệ thống nên không thể vào trang chat.'
    }
    if (code.includes('auth/register-sync-failed')) {
      return `Đăng ký chưa hoàn tất do lỗi đồng bộ dữ liệu. ${message || 'Vui lòng thử lại.'}`
    }

    if (message.includes('VITE_API_BASE_URL')) return message
    if (message.includes('Không kết nối được API chat')) return message
    if (message.includes('Tai khoan chua duoc cap quyen chat')) {
      return 'Tài khoản chưa được cấp quyền chat. Vui lòng liên hệ quản trị viên.'
    }

    if (message.includes('auth/email-already-in-use')) return 'Email này đã được sử dụng.'
    if (message.includes('auth/invalid-credential')) return 'Email hoặc mật khẩu không đúng.'

    if (message) {
      return message
    }

    const details = error && typeof error === 'object' ? JSON.stringify(error) : ''
    return code
      ? `Không thể xác thực tài khoản (${code}). Hãy kiểm tra cấu hình Firebase Authentication.`
      : details
        ? `Không thể xác thực tài khoản. Chi tiết: ${details}`
        : 'Không thể xác thực tài khoản. Vui lòng thử lại.'
  }

  const ensureMongoProfile = async (user) => {
    try {
      await fetchUserProfile(user.uid)
      await setProvisionedUserAccess(user.uid)
      return true
    } catch {
      await removeProvisionedUserAccess(user.uid).catch(() => {})
      await logoutUser()
      const profileError = new Error('Mongo profile not found')
      profileError.code = 'auth/profile-not-found'
      throw profileError
    }
  }

  const isEmailAlreadyInUseError = (error) => {
    const code = error?.code || ''
    const message = error?.message || ''
    return (
      code.includes('auth/email-already-in-use') ||
      message.includes('auth/email-already-in-use')
    )
  }

  useEffect(() => {
    const unsubscribe = onAuthChanged(async (user) => {
      if (authSubmitInProgressRef.current) {
        return
      }

      if (!user) {
        setCurrentUser(null)
        setAuthLoading(false)
        return
      }

      try {
        await ensureMongoProfile(user)
        setCurrentUser(user)
        setAuthError('')
      } catch (error) {
        setCurrentUser(null)
        setAuthError(toFriendlyAuthError(error))
      } finally {
        setAuthLoading(false)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const handleAuthSubmit = async ({ email, password, displayName }) => {
    setAuthError('')
    authSubmitInProgressRef.current = true
    let createdUser = null

    try {
      await checkApiReady()

      if (isRegisterMode) {
        let credential

        try {
          credential = await registerWithEmail(email, password, displayName)
          createdUser = credential.user
        } catch (registerError) {
          if (!isEmailAlreadyInUseError(registerError)) {
            throw registerError
          }

          // Recover from partial registrations where Auth user exists but Mongo profile is missing.
          try {
            credential = await loginWithEmail(email, password)
          } catch (loginError) {
            const recoverError = new Error(
              'Email đã tồn tại trên Firebase. Hãy nhập đúng mật khẩu đã tạo trước đó để hệ thống tự đồng bộ MongoDB.'
            )
            recoverError.code = loginError?.code || 'auth/invalid-login-credentials'
            throw recoverError
          }
        }

        await upsertUserProfile({
          firebaseUid: credential.user.uid,
          email: credential.user.email || email || '',
          displayName: credential.user.displayName || displayName?.trim() || '',
          photoURL: credential.user.photoURL || '',
        })
        await setProvisionedUserAccess(credential.user.uid)
        setCurrentUser(credential.user)
      } else {
        const credential = await loginWithEmail(email, password)
        await ensureMongoProfile(credential.user)
        setCurrentUser(credential.user)
      }
    } catch (error) {
      if (isRegisterMode && createdUser) {
        await removeProvisionedUserAccess(createdUser.uid).catch(() => {})
        await deleteAuthUser(createdUser).catch(() => logoutUser().catch(() => {}))

        const syncError = new Error(error?.message || 'Loi dong bo user profile')
        syncError.code = error?.code || 'auth/register-sync-failed'
        setAuthError(toFriendlyAuthError(syncError))
        return
      }

      setCurrentUser(null)
      setAuthError(toFriendlyAuthError(error))
    } finally {
      authSubmitInProgressRef.current = false
      setAuthLoading(false)
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
        isAccountMissing={authError.includes('chưa được tạo')}
      />
    )
  }

  return (
    <Chat currentUser={currentUser} onLogout={handleLogout} authError={authError} />
  )
}

export default App
