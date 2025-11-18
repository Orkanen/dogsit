const API_BASE = import.meta.env.VITE_API_BASE

const handleResponse = async (res) => {
    const data = await res.json()
    if (!res.ok) {
        throw new Error(data.error || data.message || 'Request failed')
    }
    return data
}

const sitterApi = {
    // SITTERS
    getSitters: () =>
    fetch(`${API_BASE}/sitters`, {
      headers: { "Content-Type": "application/json" }
    }).then(handleResponse),
}

export default sitterApi
