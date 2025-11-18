import { useEffect, useState } from "react";
import api from "../api/index";
import { Link, useNavigate } from "react-router-dom";

export default function Sitters() {
  const [sitters, setSitters] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isOwner = user?.role === "owner";
  const linkStyle = { color: '#1d4ed8', textDecoration: 'underline', fontWeight: '500' }

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [sittersData, matchesData] = await Promise.all([
          api.getSitters(),
          isOwner ? api.getMatches() : Promise.resolve({ sent: [], received: [] }),
        ]);

        const filtered = sittersData.filter(s => s.id !== user?.id);

        setSitters(filtered);
        setMatches(isOwner ? [...matchesData.sent, ...matchesData.received] : []);
      } catch (e) {
        setError(e.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isOwner, user?.id]);

  const handleRequest = async (sitterId) => {
    if (!isOwner) return alert("Only owners can request");
    try {
      await api.createMatch(sitterId);
      alert("Request sent!");
      navigate("/matches");
    } catch (e) {
      alert(e.message || "Request failed");
    }
  };

  const hasMatchWith = (sitterId) => {
    return matches.some(m => 
      m.sitterId === sitterId || m.ownerId === sitterId
    );
  };

  if (loading) return <p style={{ padding: "1rem" }}>Loading…</p>;
  if (error) return <p style={{ color: "#dc2626", padding: "1rem" }}>{error}</p>;

  return (
    <div style={{ maxWidth: "48rem", margin: "0 auto", padding: "1rem", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1rem" }}>
        Find a Sitter
      </h1>

      {sitters.length === 0 ? (
        <p style={{ color: "#6b7280" }}>No sitters available.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {sitters.map((s) => {
            const profile = s.profile || {};
            const alreadyMatched = isOwner && hasMatchWith(s.id);

            return (
              <div
                key={s.id}
                style={{
                  border: "1px solid #d1d5db",
                  borderRadius: "0.5rem",
                  padding: "1rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  opacity: alreadyMatched ? 0.7 : 1,
                }}
              >
                <div style={{ flex: 1 }}>
                  <Link
                    to={`/profile/${s.id}`}
                    style={{ fontWeight: "600", color: "#1d4ed8", textDecoration: "underline" }}
                  >
                    {profile.firstName || "—"} {profile.lastName || ""} ({profile.location || "No location"})
                  </Link>
                  {profile.bio && (
                    <p style={{ margin: "0.5rem 0", fontSize: "0.875rem", color: "#4b5563" }}>
                      {profile.bio}
                    </p>
                  )}
                  {profile.servicesOffered && (
                    <p style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                      Services: {profile.servicesOffered}
                    </p>
                  )}
                  {alreadyMatched && (
                    <p style={{ fontSize: "0.75rem", color: "#f59e0b", fontStyle: "italic" }}>
                      Already requested
                    </p>
                  )}
                </div>

                {isOwner && !alreadyMatched && (
                  <button
                    onClick={() => handleRequest(s.id)}
                    style={{
                      padding: "0.5rem 1rem",
                      background: "#2563eb",
                      color: "white",
                      borderRadius: "0.375rem",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Request
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
      <Link to="/matches" style={linkStyle}>Back to Matches</Link>
    </div>
  );
}