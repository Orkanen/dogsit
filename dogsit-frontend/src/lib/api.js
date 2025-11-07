const API_BASE = import.meta.env.VITE_API_BASE

const handleResponse = async (res) => {
    const data = await res.json()
    if (!res.ok) {
        throw new Error(data.error || data.message || 'Request failed')
    }
    return data
}

const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
})

const api = {
    // AUTH
    login: (email, password) =>
    fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    }).then(handleResponse),

    register: (email, password, roleNames) =>
    fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, roleNames }),
    }).then(handleResponse),

    // MESSAGES
    getMessages: (matchId, token) =>
    fetch(`${API_BASE}/message/${matchId}`, {
        headers: { Authorization: `Bearer ${token}` },
    }).then(handleResponse),

    // PROFILE
    getProfile: () =>
    fetch(`${API_BASE}/profile`, {
    headers: getAuthHeaders(),
    }).then(handleResponse),

    updateProfile: (data) =>
    fetch(`${API_BASE}/profile`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
    }).then(handleResponse),
}

export default api
