import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";

export default function ChatList() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const matches = await api.getMatches();
        const accepted = [...matches.sent, ...matches.received]
          .filter(m => m.status === "ACCEPTED");
        setChats(accepted);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div style={{ padding: "2rem" }}>Loading chats...</div>;

  return (
    <div style={{ padding: "1rem", maxWidth: "48rem", margin: "0 auto" }}>
      <h2 style={{ marginBottom: "1rem" }}>Your Chats</h2>
      {chats.length === 0 ? (
        <p>No active chats. <Link to="/matches" style={{ color: "#1d4ed8" }}>Go to Matches</Link></p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {chats.map(match => {
            const partner = match.ownerId === JSON.parse(localStorage.getItem("user") || "{}").id
              ? match.sitter
              : match.owner;
            return (
              <Link
                key={match.id}
                to={`/chat/${match.id}`}
                style={{
                  padding: "1rem",
                  background: "#f9fafb",
                  borderRadius: "8px",
                  textDecoration: "none",
                  color: "inherit",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <div>
                  <strong>{partner.profile?.firstName || "User"}</strong>
                  <p style={{ margin: "0.25rem 0", fontSize: "0.875rem", color: "#6b7280" }}>
                    {partner.email}
                  </p>
                </div>
                <span style={{ fontSize: "1.5rem" }}>→</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}