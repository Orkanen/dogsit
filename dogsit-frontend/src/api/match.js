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

const matchApi = {
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
}

export default matchApi
