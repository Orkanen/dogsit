import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/index";
import "@/styles/pages/_sitters.scss";

export default function Sitters() {
  const [sitters, setSitters] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isOwner = user && (
    user.role === "owner" || 
    (Array.isArray(user.roles) && user.roles.includes("owner"))
  );
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [sittersData, matchesData] = await Promise.all([
          api.getSitters(),
          isOwner ? api.getMatches() : Promise.resolve({ sent: [], received: [] }),
        ]);

        const filtered = sittersData.filter((s) => s.id !== user?.id);
        setSitters(filtered);
        setMatches(isOwner ? [...matchesData.sent, ...matchesData.received] : []);
      } catch (e) {
        setError(e.message || "Failed to load sitters");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isOwner, user?.id]);

  const handleRequest = async (sitterId) => {
    if (!isOwner) {
      alert("Only dog owners can send requests");
      return;
    }
    try {
      await api.createMatch(sitterId);
      alert("Request sent successfully!");
      navigate("/matches");
    } catch (e) {
      alert(e.message || "Failed to send request");
    }
  };

  const hasMatchWith = (sitterId) => {
    return matches.some((m) => m.sitterId === sitterId || m.ownerId === sitterId);
  };

  if (loading) return <div className="sitters__loader">Loading sitters…</div>;
  if (error) return <div className="sitters__error">{error}</div>;

  return (
    <section className="sitters">
      <header className="sitters__header">
        <h1 className="sitters__title">Find a Sitter</h1>
        <Link to="/matches" className="sitters__back-link">
          Back to Matches
        </Link>
      </header>

      {sitters.length === 0 ? (
        <div className="sitters__empty">
          <p>No sitters available at the moment.</p>
          <p className="sitters__empty-hint">
            Check back soon — more caring sitters join every day.
          </p>
        </div>
      ) : (
        <div className="sitters__grid">
          {sitters.map((s) => {
            const profile = s || {};
            const alreadyMatched = isOwner && hasMatchWith(s.id);

            return (
              <article
                key={s.id}
                className={`sitters__card ${alreadyMatched ? "sitters__card--matched" : ""}`}
              >
                <div className="sitters__info">
                <Link to={`/sitter/${s.id}`} className="sitters__name">
                  {profile.firstName || "User"} {profile.lastName || ""}
                </Link>

                  {profile.location && (
                    <p className="sitters__location">{profile.location}</p>
                  )}

                  {profile.bio ? (
                    <p className="sitters__bio">{profile.bio}</p>
                  ) : (
                    <p className="sitters__bio sitters__bio--empty">
                      No bio yet.
                    </p>
                  )}

                  {profile.servicesOffered && (
                    <p className="sitters__services">
                      <strong>Services:</strong> {profile.servicesOffered}
                    </p>
                  )}

                  {alreadyMatched && (
                    <p className="sitters__status">Request already sent</p>
                  )}
                </div>

                {/* Button is ALWAYS visible — just changes style when matched */}
                {isOwner && (
                  <button
                    onClick={() => handleRequest(s.id)}
                    disabled={alreadyMatched}
                    className={`sitters__request-btn ${
                      alreadyMatched ? "sitters__request-btn--sent" : ""
                    }`}
                  >
                    {alreadyMatched ? "Request Sent" : "Send Request"}
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}