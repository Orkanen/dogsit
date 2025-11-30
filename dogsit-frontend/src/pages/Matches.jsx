import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/index";
import "@/styles/pages/_matches.scss";

export default function Matches() {
  const [tab, setTab] = useState("received");
  const [data, setData] = useState({ sent: [], received: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.getMatches();
      setData(res);
    } catch (e) {
      setError(e.message || "Failed to load matches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAccept = async (id) => {
    try {
      await api.acceptMatch(id);
      load();
    } catch {
      alert("Failed to accept match");
    }
  };

  const handleReject = async (id) => {
    try {
      await api.rejectMatch(id);
      load();
    } catch {
      alert("Failed to reject match");
    }
  };

  const handleCancel = async (id) => {
    try {
      await api.cancelMatch(id);
      load();
    } catch {
      alert("Failed to cancel match");
    }
  };

  const matches = tab === "sent" ? data.sent : data.received;

  return (
    <section className="matches">
      <header className="matches__header">
        <h1 className="matches__title">My Matches</h1>
        <Link to="/sitters" className="matches__find-link">
          Find Sitters
        </Link>
      </header>

      <div className="matches__tabs">
        {["received", "sent"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`matches__tab ${tab === t ? "matches__tab--active" : ""}`}
          >
            {t === "received" ? "Incoming" : "Outgoing"}
            <span className="matches__count">
              {t === "received" ? data.received.length : data.sent.length}
            </span>
          </button>
        ))}
      </div>

      {loading && <div className="matches__loader">Loading matches…</div>}
      {error && <div className="matches__error">{error}</div>}

      <div className="matches__list">
        {matches.length === 0 ? (
          <div className="matches__empty">
            <p>No {tab === "received" ? "incoming" : "outgoing"} matches yet.</p>
            {tab === "received" && (
              <Link to="/sitters" className="matches__cta">
                Someone out there is waiting for you
              </Link>
            )}
          </div>
        ) : (
          matches.map((m) => {
            const partner = tab === "sent" ? m.sitter : m.owner;
            if (!partner) return null;

            const profile = partner.profile || {};
            const isPending = m.status === "PENDING";
            const canAct = isPending;

            return (
              <article key={m.id} className="matches__card">
                <div className="matches__info">
                  <Link
                    to={`/sitter/${partner.id}`}
                    className="matches__name-link"
                  >
                    {profile.firstName || "User"} {profile.lastName || ""}
                  </Link>

                  {profile.location && (
                    <p className="matches__location">{profile.location}</p>
                  )}

                  <div className="matches__status">
                    Status:{" "}
                    <span
                      className={`matches__status-text matches__status-text--${m.status.toLowerCase()}`}
                    >
                      {m.status}
                    </span>
                  </div>

                  {m.status === "ACCEPTED" && (
                    <Link to={`/chat/${m.id}`} className="matches__chat-link">
                      Open Chat
                    </Link>
                  )}
                </div>

                {canAct && (
                  <div className="matches__actions">
                    {tab === "received" && (
                      <>
                        <button
                          onClick={() => handleAccept(m.id)}
                          className="matches__btn matches__btn--accept"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleReject(m.id)}
                          className="matches__btn matches__btn--reject"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {tab === "sent" && (
                      <button
                        onClick={() => handleCancel(m.id)}
                        className="matches__btn matches__btn--cancel"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>

      <Link to="/" className="matches__home-link">
        Back to Home
      </Link>
    </section>
  );
}