const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').trim()
const isBrowserLocalhost =
  typeof window !== 'undefined' &&
  ['localhost', '127.0.0.1'].includes(window.location.hostname)

// In local dev, fall back to local backend if env is not set.
const API_BASE_URL = rawBaseUrl || (isBrowserLocalhost ? 'http://localhost:9999' : '')

const normalizeBaseUrl = (baseUrl) => baseUrl.replace(/\/$/, '')

const request = async (path, options = {}) => {
  if (!API_BASE_URL) {
    throw new Error(
      'Chưa cấu hình VITE_API_BASE_URL cho môi trường deploy. Nếu dùng Vercel, vào Project Settings > Environment Variables và thêm URL backend API công khai.'
    )
  }

  if (
    typeof window !== 'undefined' &&
    normalizeBaseUrl(API_BASE_URL) === normalizeBaseUrl(window.location.origin)
  ) {
    throw new Error(
      'VITE_API_BASE_URL đang trỏ vào chính frontend domain. Hãy đổi sang domain backend API (ví dụ Railway/Render).'
    )
  }

  if (
    typeof window !== 'undefined' &&
    !isBrowserLocalhost &&
    /localhost|127\.0\.0\.1/.test(API_BASE_URL)
  ) {
    throw new Error(
      'VITE_API_BASE_URL đang trỏ tới localhost nên bản deploy không thể kết nối. Hãy đổi sang URL backend public (Railway/Render).' 
    )
  }

  if (
    typeof window !== 'undefined' &&
    window.location.protocol === 'https:' &&
    API_BASE_URL.startsWith('http://')
  ) {
    throw new Error(
      'Trang đang chạy HTTPS nhưng API lại là HTTP. Hãy đổi VITE_API_BASE_URL sang HTTPS để tránh bị trình duyệt chặn.'
    )
  }

  let response

  try {
    response = await fetch(`${normalizeBaseUrl(API_BASE_URL)}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    })
  } catch {
    throw new Error(
      `Không kết nối được API chat. Kiểm tra backend đã chạy chưa. API URL hiện tại: ${normalizeBaseUrl(API_BASE_URL)}`
    )
  }

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.message || 'Request failed')
  }

  return data
}

export const fetchMessages = (limit = 50) => {
  return request(`/api/messages?limit=${limit}`)
}

export const sendChatMessage = (username, text) => {
  return request('/api/messages', {
    method: 'POST',
    body: JSON.stringify({ username, text }),
  })
}

export const fetchUsers = () => {
  return request('/api/users')
}

export const joinChat = (userId, username) => {
  return request('/api/users', {
    method: 'POST',
    body: JSON.stringify({ userId, username }),
  })
}

export const leaveChat = (userId) => {
  return request(`/api/users/${userId}`, {
    method: 'DELETE',
  })
}

export const upsertUserProfile = ({ firebaseUid, email, displayName, photoURL }) => {
  return request('/api/user-profiles/upsert', {
    method: 'POST',
    body: JSON.stringify({
      firebaseUid,
      email,
      displayName,
      photoURL,
    }),
  })
}

export const fetchUserProfile = (firebaseUid) => {
  return request(`/api/user-profiles/${firebaseUid}`)
}
