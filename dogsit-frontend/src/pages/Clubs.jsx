import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/api";
import "@/styles/pages/_clubs.scss";

export default function Clubs() {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.club.listClubs()
      .then(data => {
        const list = Array.isArray(data) ? data : data?.clubs || [];
        setClubs(list);
      })
      .catch(() => setError("Failed to load clubs"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="clubs-page">
      <main className="clubs-page__main">
        <header className="clubs-page__header">
          <h1>Dog Clubs & Communities</h1>
          <p>Join training clubs, agility groups, breed clubs, and more across the country</p>
        </header>

        {loading && <div className="clubs-page__loading">Loading clubs…</div>}
        {error && <div className="clubs-page__error">{error}</div>}

        {!loading && !error && clubs.length === 0 && (
          <div className="clubs-page__empty">
            <h2>No clubs yet</h2>
            <p>Be the first to create a community!</p>
            <Link to="/club/create" className="btn btn--primary">Create a Club</Link>
          </div>
        )}

        {!loading && !error && clubs.length > 0 && (
          <div className="clubs-page__grid">
            {clubs.map(club => (
              <div key={club.id} className="club-card__wrapper">
                <Link to={`/club/${club.id}`} className="block h-full">
                  {/* Your ClubCard component goes here */}
                  <div style={{ padding: "1.5rem", background: "white", height: "100%", borderRadius: "1rem" }}>
                    <h3 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
                      {club.name}
                    </h3>
                    <p style={{ color: "#64748b", fontSize: "2rem", fontWeight: "bold", margin: "1rem 0" }}>
                      {club.members?.length || 0}
                    </p>
                    <p style={{ color: "#94a3b8", fontSize: "0.875rem" }}>
                      member{club.members?.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="clubs-page__footer">
        <Link to="/">← Back to Home</Link>
        <Link to="/club/create">Create a Club</Link>
      </footer>
    </div>
  );
}