import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../api/index";
import { useAuth } from "../context/AuthContext";
import "@/styles/pages/_sitter-public.scss";

export default function SitterPublicProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [sitter, setSitter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isOwner = user?.roles?.includes("owner");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getSitterById(id);
        console.log("Sitter data:", data);
        setSitter(data);
      } catch (err) {
        console.error("Failed to load sitter:", err);
        setError("Sitter not found");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleRequest = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!isOwner) {
      alert("Only dog owners can send requests");
      return;
    }
    try {
      await api.createMatch(sitter.id);
      alert("Request sent! Check your matches.");
      navigate("/matches");
    } catch (e) {
      alert(e.message || "Failed to send request");
    }
  };

  if (loading) return <div className="sitter-public__loader">Loading sitter…</div>;
  if (error) return <div className="sitter-public__error">{error}</div>;

  const p = sitter.profile;

  return (
    <section className="sitter-public">
      <div className="sitter-public__card">
        <header className="sitter-public__header">
          <h1 className="sitter-public__name">
            {p.firstName} {p.lastName}
          </h1>
          <Link to="/sitters" className="sitter-public__back">
            ← Back to Sitters
          </Link>
        </header>

        <div className="sitter-public__grid">
          <div className="sitter-public__main">
            {p.location && <p className="sitter-public__location">📍 {p.location}</p>}

            {p.sitterDescription ? (
              <div className="sitter-public__description">
                <h3>About Me</h3>
                <p>{p.sitterDescription}</p>
              </div>
            ) : (
              <p className="sitter-public__empty">No description yet.</p>
            )}

            {p.servicesOffered && (
              <div className="sitter-public__services">
                <h3>Services Offered</h3>
                <p>{p.servicesOffered}</p>
              </div>
            )}
          </div>

          <aside className="sitter-public__sidebar">
            <div className="sitter-public__price">
              <strong>€{p.pricePerDay || "?"} / day</strong>
            </div>

            <div className="sitter-public__availability">
              <h4>Available Times</h4>
              <div className="sitter-public__chips">
                {["MORNING", "DAY", "NIGHT"].map(period => {
                  const has = p.availability?.includes(period);
                  return (
                    <span
                      key={period}
                      className={`chip ${has ? "chip--active" : "chip--inactive"}`}
                    >
                      {period.charAt(0) + period.slice(1).toLowerCase()}
                    </span>
                  );
                })}
              </div>
            </div>

            {(p.publicEmail || p.publicPhone) && (
              <div className="sitter-public__contact">
                <h4>Contact</h4>
                {p.publicEmail && <p>📧 {p.publicEmail}</p>}
                {p.publicPhone && <p>📞 {p.publicPhone}</p>}
              </div>
            )}

            {isOwner && (
              <button onClick={handleRequest} className="sitter-public__request-btn">
                Send Request
              </button>
            )}

            {!user && (
              <Link to="/login" className="sitter-public__login-cta">
                Log in to send a request
              </Link>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}