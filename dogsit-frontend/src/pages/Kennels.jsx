import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/api";
import KennelCard from "@/components/ui/cards/KennelCard";
import "@/styles/pages/_kennels.scss";

export default function Kennels() {
  const [kennels, setKennels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.kennel.getKennels()
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.kennels || [];
        setKennels(list);
      })
      .catch((err) => {
        console.error("Failed to load kennels:", err);
        setError("Unable to load kennels right now.");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="kennels-page">
      <main className="kennels-page__main">
        <header className="kennels-page__header">
          <h1>Discover Kennels</h1>
          <p>Browse trusted kennels and their communities</p>
        </header>

        {loading && <div className="kennels-page__loading">Loading kennels…</div>}
        {error && <div className="kennels-page__error">{error}</div>}

        {!loading && !error && kennels.length === 0 && (
          <div className="kennels-page__empty">
            <h2>No kennels yet</h2>
            <p>Be the first to register one!</p>
            <Link to="/kennel/create" className="btn btn--primary">
              Register a Kennel
            </Link>
          </div>
        )}

        {!loading && !error && kennels.length > 0 && (
          <div className="kennels-page__grid">
            {kennels.map((kennel) => (
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