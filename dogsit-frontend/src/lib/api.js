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

    // MATCHES
    getMatches: () =>
    fetch(`${API_BASE}/match`, { headers: getAuthHeaders() }).then(handleResponse),

    createMatch: (sitterId) =>
        fetch(`${API_BASE}/match`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ sitterId }),
        }).then(handleResponse),

    // ACCEPT
    acceptMatch: (matchId) =>
    fetch(`${API_BASE}/match/${matchId}/accept`, {
      method: "PATCH",
      headers: getAuthHeaders(),
    }).then(handleResponse),
  
    // REJECT
    rejectMatch: (matchId) =>
        fetch(`${API_BASE}/match/${matchId}/reject`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        }).then(handleResponse),

    // CANCEL
    cancelMatch: (matchId) =>
        fetch(`${API_BASE}/match/${matchId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        }).then(handleResponse),

    // CREATE REQUEST
    createMatch: (sitterId) =>
        fetch(`${API_BASE}/match`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ sitterId }),
        }).then(handleResponse),

    // SITTERS
    getSitters: () =>
    fetch(`${API_BASE}/sitters`, {
      headers: { "Content-Type": "application/json" }
    }).then(handleResponse),
}

export default api
