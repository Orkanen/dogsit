const API_BASE = import.meta.env.VITE_API_BASE

const handleResponse = async (res) => {
    const data = await res.json()
    if (!res.ok) {
        throw new Error(data.error || data.message || 'Request failed')
    }
    return data
}

const messageApi = {
    // MESSAGES
    getMessages: (matchId, token) =>
    fetch(`${API_BASE}/message/${matchId}`, {
        headers: { Authorization: `Bearer ${token}` },
    }).then(handleResponse),
}

export default messageApi
