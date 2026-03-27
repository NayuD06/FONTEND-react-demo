import { useState } from 'react'
import './AuthForm.css'

export default function AuthForm({ isRegisterMode, onSubmit, onToggleMode, error }) {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [localError, setLocalError] = useState('')

  const hasUppercase = /[A-Z]/.test(password)
  const hasSpecialCharacter = /[^A-Za-z0-9]/.test(password)
  const hasAtInEmail = email.includes('@')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLocalError('')

    if (!email.trim() || !password.trim()) {
      setLocalError('Vui lòng nhập đầy đủ email và mật khẩu.')
      return
    }

    if (isRegisterMode && !displayName.trim()) {
      setLocalError('Vui lòng nhập tên hiển thị.')
      return
    }

    if (!hasAtInEmail) {
      setLocalError('Email phải chứa ký tự @.')
      return
    }

    if (!hasUppercase || !hasSpecialCharacter) {
      setLocalError('Mật khẩu cần có ít nhất 1 chữ in hoa và 1 ký tự đặc biệt.')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit({
        displayName,
        email,
        password,
      })
      setPassword('')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-container">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Chat App</h1>
        <p>{isRegisterMode ? 'Tạo tài khoản để bắt đầu chat' : 'Đăng nhập để tiếp tục'}</p>

        {isRegisterMode && (
          <input
            type="text"
            value={displayName}
            placeholder="Tên hiển thị"
            onChange={(event) => {
              setDisplayName(event.target.value)
              setLocalError('')
            }}
            className="auth-input"
          />
        )}

        <input
          type="email"
          value={email}
          placeholder="Email"
          onChange={(event) => {
            setEmail(event.target.value)
            setLocalError('')
          }}
          className={`auth-input ${!hasAtInEmail && email ? 'auth-input-invalid' : ''}`}
        />

        <input
          type="password"
          value={password}
          placeholder="Mật khẩu"
          onChange={(event) => {
            setPassword(event.target.value)
            setLocalError('')
          }}
          className={`auth-input ${password && (!hasUppercase || !hasSpecialCharacter) ? 'auth-input-invalid' : ''}`}
        />

        <div className="auth-rules">
          <p className={hasAtInEmail || !email ? 'rule-ok' : 'rule-fail'}>• Email phải có ký tự @</p>
          <p className={hasUppercase || !password ? 'rule-ok' : 'rule-fail'}>• Mật khẩu có ít nhất 1 chữ in hoa</p>
          <p className={hasSpecialCharacter || !password ? 'rule-ok' : 'rule-fail'}>• Mật khẩu có ít nhất 1 ký tự đặc biệt</p>
        </div>

        <button type="submit" className="auth-button" disabled={isSubmitting}>
          {isSubmitting ? 'Đang xử lý...' : isRegisterMode ? 'Đăng ký' : 'Đăng nhập'}
        </button>

        {localError && <p className="auth-error">{localError}</p>}
        {error && <p className="auth-error">{error}</p>}

        <button type="button" className="auth-toggle" onClick={onToggleMode}>
          {isRegisterMode ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký'}
        </button>
      </form>
    </div>
  )
}
