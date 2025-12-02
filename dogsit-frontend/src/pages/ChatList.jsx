import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/index";
import { useAuth } from "../context/AuthContext";
import "@/styles/pages/_chatList.scss";

export default function ChatList() {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadChats = async () => {
      try {
        const matches = await api.getMatches();
        const accepted = [...matches.sent, ...matches.received].filter(
          (m) => m.status === "ACCEPTED"
        );
        setChats(accepted);
      } catch (err) {
        console.error("Failed to load chats:", err);
      } finally {
        setLoading(false);
      }
    };

    loadChats();
  }, []);

  const getPartner = (match) => {
    return match.ownerId === user?.id ? match.sitter : match.owner;
  };

  if (loading) return <div className="chat-list__loader">Loading your chats…</div>;

  return (
    <section className="chat-list">
      <header className="chat-list__header">
        <h1 className="chat-list__title">Your Chats</h1>
        <Link to="/matches" className="chat-list__matches-link">
          Go to Matches
        </Link>
      </header>

      {chats.length === 0 ? (
        <div className="chat-list__empty">
          <p>No active chats yet.</p>
          <Link to="/matches" className="chat-list__cta">
            Find someone to chat with
          </Link>
        </div>
      ) : (
        <div className="chat-list__grid">
          {chats.map((match) => {
            const partner = getPartner(match);

            return (
              <Link
                key={match.id}
                to={`/chat/${match.id}`}
                className="chat-list__item"
              >
                <div className="chat-list__partner">
                  <div className="chat-list__avatar">
                    {partner.profile?.firstName?.[0] || "U"}
                  </div>
                  <div className="chat-list__info">
                    <h3 className="chat-list__name">
                      {partner.profile?.firstName
                        ? `${partner.profile.firstName} ${partner.profile.lastName || ""}`.trim()
                        : "User"}
                    </h3>
                    <p className="chat-list__email">{partner.email}</p>
                  </div>
                </div>
                <span className="chat-list__arrow">Right Arrow</span>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}