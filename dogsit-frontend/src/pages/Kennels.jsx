import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from "@/api";
import KennelCard from "@/components/ui/cards/KennelCard";
import "@/styles/pages/_kennels.scss";

export default function Kennels() {
  const [kennels, setKennels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getKennels()
      .then(data => {
        const list = Array.isArray(data) ? data : data?.kennels || [];
        setKennels(list);
      })
      .catch(() => setError('Failed to load kennels'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="kennels-page__loading">Loading kennels…</div>;
  if (error) return <div className="kennels-page__error">{error}</div>;

  return (
    <div className="kennels-page">
      <main className="kennels-page__main">
        <div className="kennels-page__header">
          <h1>Discover Kennels</h1>
          <p>Browse kennels and their communities</p>
        </div>

        {kennels.length === 0 ? (
          <p className="kennels-page__empty">No kennels found.</p>
        ) : (
        <div className="kennels-page__grid">
          {kennels.map(kennel => (
            <div key={kennel.id} className="kennel-card__wrapper">
              <KennelCard kennel={kennel} />
            </div>
          ))}
        </div>
        )}
      </main>

      <footer className="kennels-page__footer">
        <Link to="/">← Back to Home</Link>
        <Link to="/kennel/dashboard">My Kennel Dashboard</Link>
      </footer>
    </div>
  );
}