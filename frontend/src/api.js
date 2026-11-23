const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/+$/, '')

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = {}

  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    const error = new Error('Backend injoignable. Vérifiez que le serveur est démarré.')
    error.code = 'NETWORK_ERROR'
    throw error
  }

  let payload = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    const error = new Error(payload?.error?.message || `Erreur HTTP ${response.status}`)
    error.status = response.status
    error.code = payload?.error?.code || 'HTTP_ERROR'
    throw error
  }

  return payload
}

export const api = {
  getHealth: () => request('/health'),
  getStatus: () => request('/status'),
  getEvents: (limit = 20) => request(`/events?limit=${limit}`),
  login: (accessCode) => request('/auth/login', { method: 'POST', body: { accessCode } }),
  openDoor: (token) => request('/door/open', { method: 'POST', token }),
  setAlarm: (token, enabled) => request('/alarm', { method: 'POST', token, body: { enabled } }),
}
