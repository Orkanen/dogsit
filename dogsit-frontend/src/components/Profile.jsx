import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../lib/api'

const inputStyle = { width: '100%', padding: '0.75rem', margin: '0.5rem 0', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1rem' }
const buttonStyle = { width: '100%', padding: '0.75rem', marginTop: '1rem', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem' }
const linkStyle = { color: '#1d4ed8', textDecoration: 'underline', fontWeight: '500' }

export default function Profile() {
    const { id } = useParams()
    const currentUser = JSON.parse(localStorage.getItem('user') || 'null')
    const [profile, setProfile] = useState(null)
    const [form, setForm] = useState({
        firstName: '', lastName: '', bio: '', location: '', dogBreed: '', servicesOffered: ''
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const navigate = useNavigate()

    useEffect(() => {
        if (!currentUser) {
        navigate('/login')
        return
        }
        if (Number(id) !== currentUser.id) {
        setError('Access denied.')
        setLoading(false)
        return
        }

        const load = async () => {
        try {
            const data = await api.getProfile()
            setProfile(data)
            setForm({
            firstName: data.profile?.firstName || '',
            lastName: data.profile?.lastName || '',
            bio: data.profile?.bio || '',
            location: data.profile?.location || '',
            dogBreed: data.profile?.dogBreed || '',
            servicesOffered: data.profile?.servicesOffered || '',
            })
        } catch (err) {
            setError(err.message)
            if (err.message.includes('401')) navigate('/login')
        } finally {
            setLoading(false)
        }
        }

        load()
    }, [id, currentUser?.id])  // ← Only re-run if user ID changes

    const handleChange = (e) => {
        const { name, value } = e.target
        if (name) {
        setForm(prev => ({ ...prev, [name]: value }))
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSaving(true)
        try {
        const updatedProfile = await api.updateProfile(form)
        setProfile(prev => ({ ...prev, profile: updatedProfile }))
        alert('Profile saved!')
        } catch (err) {
        setError(err.message || 'Failed to save')
        } finally {
        setSaving(false)
        }
    }

    if (loading) return <div style={{ padding: '2rem' }}>Loading...</div>
    if (error && !profile) return <div style={{ padding: '2rem', color: 'red' }}>{error}</div>

    return (
        <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
        <h2>Edit Profile</h2>
        <p><strong>Email:</strong> {profile.email}</p>
        <p><strong>Role:</strong> {profile.role}</p>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <form onSubmit={handleSubmit}>
            <input key="firstName" name="firstName" placeholder="First Name" value={form.firstName} onChange={handleChange} style={inputStyle} />
            <input key="lastName" name="lastName" placeholder="Last Name" value={form.lastName} onChange={handleChange} style={inputStyle} />
            <textarea key="bio" name="bio" placeholder="Bio" value={form.bio} onChange={handleChange} style={{ ...inputStyle, height: '100px' }} />
            <input key="location" name="location" placeholder="Location" value={form.location} onChange={handleChange} style={inputStyle} />
            <input key="dogBreed" name="dogBreed" placeholder="Dog Breed" value={form.dogBreed} onChange={handleChange} style={inputStyle} />
            <input key="servicesOffered" name="servicesOffered" placeholder="Services" value={form.servicesOffered} onChange={handleChange} style={inputStyle} />

            <button type="submit" style={buttonStyle} disabled={saving}>
            {saving ? 'Saving...' : 'Save Profile'}
            </button>
        </form>

        <div style={{ marginTop: '1rem' }}>
            <Link to="/" style={linkStyle}>Back to Home</Link>
        </div>
        </div>
    )
}