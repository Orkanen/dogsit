const API_BASE = import.meta.env.VITE_API_BASE

const handleResponse = async (res) => {
    const data = await res.json()
    if (!res.ok) {
        throw new Error(data.error || data.message || 'Request failed')
    }
    return data
}

const authApi = {
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
}

export default authApi
