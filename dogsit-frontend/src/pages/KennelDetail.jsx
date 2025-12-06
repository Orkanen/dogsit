import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import "@/styles/pages/_kennel-detail.scss";
import RequestJoinModal from "@/components/ui/RequestJoinModal";
import api from "@/api";


export default function KennelDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const [kennel, setKennel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [isMember, setIsMember] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalState, setModalState] = useState("idle");
  const [modalMessage, setModalMessage] = useState("");

  useEffect(() => {
    const loadKennel = async () => {
      try {
        const publicKennel = await api.kennel.getKennelById(id);
        setKennel(publicKennel);

        if (user) {
          const myKennels = await api.kennel.getMyKennels().catch(() => []);
          const membership = myKennels.find(k => k.id === parseInt(id));
          if (membership) {
            setIsMember(true);
            setIsOwner(membership.myRole === "OWNER");
          }
        }
      } catch (err) {
        console.error("[KennelDetail] Failed to load kennel:", err);
      } finally {
        setLoading(false);
      }
    };
    loadKennel();
  }, [id, user]);

  const handleJoinRequest = async () => {
    setModalState("loading");
    setModalMessage("");
    setModalOpen(true);

    try {
      await api.kennel.requestKennelMembership(id);
      setModalState("success");
      setTimeout(() => setModalOpen(false), 4000);
    } catch (err) {
      setModalState("error");
      setModalMessage(err.message || "Something went wrong. Please try again.");
    }
  };

  if (loading) return <div className="kennel-detail__loading">Loading kennel...</div>;
  if (!kennel) return <div className="kennel-detail__error">Kennel not found</div>;

  return (
    <article className="kennel-detail">
      <Link to="/kennel" className="kennel-detail__back">
        ← All Kennels
      </Link>

      <header className="kennel-detail__header">
        <h1 className="kennel-detail__name">{kennel.name}</h1>
        <p className="kennel-detail__location">
          {kennel.location || "Location not set"}
        </p>
      </header>

      <div className="kennel-detail__stats">
        <span>
          <strong>{kennel.memberCount}</strong> Members
        </span>
        <span>
          <strong>{kennel.dogCount}</strong> Dogs
        </span>
      </div>

      {/* Owner / Member badges */}
      {isOwner && <div className="kennel-detail__badge owner">You are the Owner</div>}
      {isMember && !isOwner && <div className="kennel-detail__badge member">You are a Member</div>}

      {/* Action buttons */}
      {!isMember && user && (
        <button
          onClick={() => api.kennel.requestKennelMembership(id)}
          className="kennel-detail__join-btn"
        >
          Request to Join Kennel
        </button>
      )}

      {!user && (
        <div className="kennel-detail__login-prompt">
          <Link to="/login" className="kennel-detail__login-link">
            Log in
          </Link>{" "}
          to request membership
        </div>
      )}
    {isOwner && (
      <Link to="/kennel/dashboard" className="kennel-profile__dashboard-link">
        Go to Dashboard →
      </Link>
    )}

    {/* MODAL */}
      <RequestJoinModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        state={modalState}
        message={modalMessage}
      />
    </article>
  );
}