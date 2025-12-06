const API_BASE = import.meta.env.VITE_API_BASE

const handleResponse = async (res) => {
    const data = await res.json()
    if (!res.ok) {
        throw new Error(data.error || data.message || 'Request failed')
    }
    return data
}

const imageApi = {
    // === IMAGES ===
    uploadImage: (formData) =>
    fetch(`/images`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            // DON'T set Content-Type — let browser set multipart/form-data
        },
        body: formData,
    }).then(handleResponse),
}

export default imageApi
