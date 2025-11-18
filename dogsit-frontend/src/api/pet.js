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

const petApi = {
    // === PETS ===
    createPet: (petData) =>
    fetch(`${API_BASE}/pets`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(petData),
    }).then(handleResponse),

    getPet: (petId) =>
    fetch(`${API_BASE}/pets/${petId}`, {
        headers: getAuthHeaders(),
    }).then(handleResponse),

    getMyPets: () =>
    fetch(`${API_BASE}/pets/my`, {
        headers: getAuthHeaders(),
    }).then(handleResponse),

    getPet: (petId) =>
    fetch(`${API_BASE}/pets/${petId}`, {
        headers: getAuthHeaders(),
    }).then(handleResponse),

    updatePet: (petId, petData) =>
    fetch(`${API_BASE}/pets/${petId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(petData),
    }).then(handleResponse),

    deletePet: (petId) =>
    fetch(`${API_BASE}/pets/${petId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
    }).then(handleResponse),

    // Attach image to pet
    attachImageToPet: (petId, imageId) =>
    fetch(`${API_BASE}/pets/${petId}/image`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ imageId }),
    }).then(handleResponse),

}

export default petApi
