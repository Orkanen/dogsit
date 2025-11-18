import { useEffect, useState } from "react";
import api from "../api/index";
import { Link } from "react-router-dom";

export default function Matches() {
  const [tab, setTab] = useState("sent");
  const [data, setData] = useState({ sent: [], received: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const linkStyle = { color: '#1d4ed8', textDecoration: 'underline', fontWeight: '500' };

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
    try { await api.acceptMatch(id); load(); } catch { alert("Failed to accept"); }
  };
  const handleReject = async (id) => {
    try { await api.rejectMatch(id); load(); } catch { alert("Failed to reject"); }
  };
  const handleCancel = async (id) => {
    try { await api.cancelMatch(id); load(); } catch { alert("Failed to cancel match"); }
  };

  const matches = tab === "sent" ? data.sent : data.received;

  return (
    <div style={{ maxWidth: "48rem", margin: "0 auto", padding: "1rem", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1rem" }}>
        My Matches
      </h1>

      <div style={{ marginTop: "1rem" }}>
        <Link to="/sitters" style={linkStyle}>Find Sitters</Link>
      </div>

      <div style={{ display: "flex", borderBottom: "1px solid #d1d5db", marginBottom: "1rem" }}>
        {["sent", "received"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "0.5rem 1rem",
              textTransform: "capitalize",
              borderBottomWidth: tab === t ? "2px" : "0",
              borderBottomStyle: tab === t ? "solid" : "none",
              borderBottomColor: tab === t ? "#2563eb" : "transparent",
              fontWeight: tab === t ? "500" : "normal",
              background: "none",
              borderLeft: "none",
              borderRight: "none",
              borderTop: "none",
              cursor: "pointer",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {loading && <p>Loading…</p>}
      {error && <p style={{ color: "#dc2626" }}>{error}</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {matches.length === 0 ? (
          <p style={{ color: "#6b7280" }}>No {tab} matches yet.</p>
        ) : (
          matches.map((m) => {
            const partner = tab === "sent" ? m.sitter : m.owner;

            if (!partner) {
              return (
                <div key={m.id} style={{ color: "#dc2626", fontStyle: "italic" }}>
                  Error: Missing partner data
                </div>
              );
            }

            const profile = partner.profile || {};

            const canAct =
              (tab === "received" && m.status === "PENDING") ||
              (tab === "sent" && m.status === "PENDING");

            return (
              <div
                key={m.id}
                style={{
                  border: "1px solid #d1d5db",
                  borderRadius: "0.5rem",
                  padding: "1rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <Link
                    to={`/profile/${partner.id}`}
                    style={{
                      fontWeight: "600",
                      color: "#1d4ed8",
                      textDecoration: "underline",
                    }}
                  >
                    {profile.firstName || "—"} {profile.lastName || ""}
                  </Link>
                  <p style={{ fontSize: "0.875rem", color: "#4b5563", margin: "0.25rem 0" }}>
                    {profile.location || ""}
                  </p>
                  <p style={{ fontSize: "0.75rem" }}>
                    Status:{" "}
                    <span
                      style={{
                        fontWeight: "500",
                        color:
                          m.status === "ACCEPTED"
                            ? "#16a34a"
                            : m.status === "REJECTED"
                            ? "#dc2626"
                            : "#6b7280",
                      }}
                    >
                      {m.status}
                    </span>
                  </p>

                  {m.status === "ACCEPTED" && (
                    <Link
                      to={`/chat/${m.id}`}
                      style={{
                        ...linkStyle,
                        display: "inline-block",
                        marginTop: "0.5rem",
                        fontSize: "0.875rem",
                      }}
                    >
                      Chat
                    </Link>
                  )}
                </div>

                {canAct && (
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    {tab === "received" && m.status === "PENDING" && (
                      <>
                        <button
                          onClick={() => handleAccept(m.id)}
                          style={{
                            padding: "0.25rem 0.75rem",
                            background: "#16a34a",
                            color: "white",
                            borderRadius: "0.25rem",
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleReject(m.id)}
                          style={{
                            padding: "0.25rem 0.75rem",
                            background: "#dc2626",
                            color: "white",
                            borderRadius: "0.25rem",
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {tab === "sent" && m.status === "PENDING" && (
                      <button
                        onClick={() => handleCancel(m.id)}
                        style={{
                          padding: "0.25rem 0.75rem",
                          background: "#4b5563",
                          color: "white",
                          borderRadius: "0.25rem",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <Link to="/" style={linkStyle}>Back to Home</Link>
    </div>
  );
}