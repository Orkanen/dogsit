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

const profileApi = {
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

    updateUserRoles: (roles) =>
    fetch(`${API_BASE}/profile/roles`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ roles }),
    }).then(handleResponse),
}

export default profileApi
