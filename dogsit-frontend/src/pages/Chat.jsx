import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { getSocket } from "../lib/socket";
import api from "@/api";
import { useAuth } from "../context/AuthContext";
import "@/styles/pages/_chat.scss";

export default function Chat() {
  const { matchId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const socket = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const data = await api.message.getMessages(matchId);
        setMessages(data);
      } catch (err) {
        console.error("Failed to load messages:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    socket.current = getSocket();
    socket.current.emit("join-match", parseInt(matchId));

    socket.current.on("new-message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.current?.off("new-message");
      socket.current?.emit("leave-match", parseInt(matchId));
    };
  }, [matchId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;

    socket.current.emit("send-message", {
      matchId: parseInt(matchId),
      message: input.trim(),
    });

    setInput("");
  };

  const isOwnMessage = (msg) => msg.sender.id === user?.id;

  if (loading) return <div className="chat__loader">Loading chat…</div>;

  return (
    <section className="chat">
      <header className="chat__header">
        <Link to="/chats" className="chat__back">
          Back to Chats
        </Link>
      </header>

      <div className="chat__messages">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`chat__message-wrapper ${isOwnMessage(msg) ? "chat__message-wrapper--own" : ""}`}
          >
            <div className="chat__sender">
              {isOwnMessage(msg) ? "You" : msg.sender.profile?.firstName || "User"}
            </div>

            <div className={`chat__bubble ${isOwnMessage(msg) ? "chat__bubble--own" : ""}`}>
              {msg.message}
            </div>

            <div className="chat__timestamp">
              {new Date(msg.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat__input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
          placeholder="Type a message..."
          className="chat__input"
        />
        <button onClick={sendMessage} className="chat__send-btn">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </section>
  );
}