import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import "@/styles/pages/_kennel-detail.scss";
import api from "@/api";


export default function KennelDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const [kennel, setKennel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    const loadKennel = async () => {
      try {
        // 1. Public data — this must always succeed
        const publicKennel = await api.getKennelById(id);
        setKennel(publicKennel);

        // 2. If logged in → silently check membership (401/403 = normal, not an error)
        if (user) {
          const myKennels = await api.getMyKennels(); // ← returns [] on auth issues (perfect)
          const membership = myKennels.find(k => k.id === parseInt(id));

          if (membership) {
            setIsMember(true);
            setIsOwner(membership.myRole === "OWNER");
          }
          // No else → being non-member is NOT an error → stay silent
        }
      } catch (err) {
        // Only real errors reach here: network down, 500, malformed response
        console.error("[KennelDetail] Failed to load kennel:", err);
      } finally {
        setLoading(false);
      }
    };

    loadKennel();
  }, [id, user]);

  if (loading) {
    return <div className="kennel-detail__loading">Loading kennel...</div>;
  }

  if (!kennel) {
    return (
      <div className="kennel-detail__error">
        <p>Kennel not found</p>
        <Link to="/kennel" className="kennel-detail__back">← Back to All Kennels</Link>
      </div>
    );
  }

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
          onClick={() => api.requestKennelMembership(id)}
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
    </article>
  );
}