import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Link } from 'react-router-dom';

const cardStyle = {
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '1rem',
  marginBottom: '1rem',
  background: '#fff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
};

const linkStyle = { color: '#1d4ed8', textDecoration: 'underline', fontWeight: '500' }

export default function Kennels() {
  const [kennels, setKennels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getKennels('/kennel')
      .then(setKennels)
      .catch(err => setError(err.message || 'Failed to load kennels'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading kennels…</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Kennels</h2>
      {kennels.length === 0 ? (
        <p>No kennels found.</p>
      ) : (
        kennels.map(k => (
          <div key={k.id} style={cardStyle}>
            <h3 style={{ margin: '0 0 0.5rem' }}>{k.name}</h3>
            <p style={{ margin: 0, color: '#6b7280' }}>
              Location {k.location || 'Location not set'}
            </p>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem' }}>
               {k.memberCount} Members{k.memberCount !== 1 ? 's' : ''} | 
               {k.dogCount} Dogs{k.dogCount !== 1 ? 's' : ''}
            </p>
            <Link
              to={`/kennel/${k.id}`}
              style={{ fontSize: '0.875rem', color: '#1d4ed8' }}
            >
              View details →
            </Link>
          </div>
        ))
      )}
        <div style={{ marginTop: '1rem' }}>
            <Link to="/" style={linkStyle}>Back to Home</Link>
            <br></br>
            <Link to="/kennel/dashboard">Kennel Dashboard</Link>
        </div>
    </div>
  );
}