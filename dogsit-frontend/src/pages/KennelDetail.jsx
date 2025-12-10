import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import api from "@/api";
import RequestJoinModal from "@/components/ui/RequestJoinModal";
import "@/styles/pages/_kennel-detail.scss";

export default function KennelDetail() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [kennel, setKennel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalState, setModalState] = useState("idle"); // idle | loading | success | error
  const [modalMessage, setModalMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const kennel = await api.kennel.getKennelById(id);
        setKennel(kennel);
  
        if (user) {
          // Check if user is a member of this specific kennel
          const myKennels = await api.kennel.getMyKennels();
          const membership = myKennels.find(k => k.id === Number(id));
          
          if (membership) {
            setIsOwner(membership.myRole === "OWNER");
            setIsMember(true);
          }
  
          // Check pending membership request
          const requests = await api.kennel.getRequests();
          const hasPending = requests.some(r => 
            r.type === "MEMBERSHIP" && 
            r.kennel.id === Number(id) && 
            r.userId === user.id
          );
          setHasPendingRequest(hasPending);
        }
      } catch (err) {
        console.error("Failed to load kennel:", err);
        setError("Kennel not found or unavailable");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, user]);

  const handleJoinRequest = async () => {
    if (!isAuthenticated) return navigate("/login");

    setModalState("loading");
    setModalMessage("Sending request...");
    setModalOpen(true);

    try {
      await api.kennel.requestKennelMembership(id);
      setModalState("success");
      setModalMessage("Request sent! The kennel owner will review it.");
      setHasPendingRequest(true);
      setTimeout(() => setModalOpen(false), 3000);
    } catch (err) {
      setModalState("error");
      setModalMessage(err.message || "Failed to send request");
    }
  };

  if (loading) return <div className="kennel-detail__loading">Loading kennel…</div>;
  if (!kennel) return <div className="kennel-detail__error">Kennel not found</div>;

  return (
    <article className="kennel-detail">
      <Link to="/kennels" className="kennel-detail__back">← All Kennels</Link>

      <header className="kennel-detail__header">
        <h1 className="kennel-detail__name">{kennel.name}</h1>
        {kennel.location && <p className="kennel-detail__location">{kennel.location}</p>}
      </header>

      <div className="kennel-detail__stats">
        <div><strong>{kennel.memberCount}</strong> Members</div>
        <div><strong>{kennel.dogCount}</strong> Registered Dogs</div>
      </div>

      {/* Status Badges */}
      {isOwner && <div className="badge badge--owner">You own this kennel</div>}
      {isMember && !isOwner && <div className="badge badge--member">You are a member</div>}
      {hasPendingRequest && <div className="badge badge--pending">Request pending</div>}

      {/* Action Buttons */}
      {!isMember && !hasPendingRequest && (
        <button onClick={handleJoinRequest} className="btn btn--primary btn--large">
          Request to Join Kennel
        </button>
      )}

      {isOwner && (
        <Link to="/kennel/dashboard" className="btn btn--success btn--large">
          Go to Kennel Dashboard →
        </Link>
      )}

      {/* Modal */}
      <RequestJoinModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        state={modalState}
        message={modalMessage}
      />
    </article>
  );
}