import { Link } from "react-router-dom";
import api from "@/api";
import "@/styles/components/cards/_pendingRequestCard.scss";

export default function PendingRequestCard({ request, onRefresh }) {
    const requester = request.user || request.pet?.owner || {};
    const profile = requester.profile || {};
    const name = profile.firstName
      ? `${profile.firstName} ${profile.lastName || ""}`.trim()
      : requester.email || "Unknown User";
    const email = requester.email || "";
    const profileId = requester.id;
    const clubName = request.club?.name || "Unknown Club";
  
    const handleAccept = async () => {
      try {
        await api.club.acceptMember(request.clubId, requester.id);
        onRefresh();
      } catch (err) {
        alert("Accept failed: " + (err.message || "Unknown error"));
      }
    };
  
    const handleReject = async () => {
      try {
        await api.club.rejectMember(request.clubId, requester.id);
        onRefresh();
      } catch (err) {
        alert("Reject failed: " + (err.message || "Unknown error"));
      }
    };
  
    return (
      <article className="pending-request-card">
        <div className="pending-request-card__info">
          <div className="pending-request-card__header">
            {profileId ? (
              <Link to={`/profile/${profileId}`} className="pending-request-card__name-link">
                {name}
              </Link>
            ) : (
              <span className="pending-request-card__name">{name}</span>
            )}
            {email && <span className="pending-request-card__email">&lt;{email}&gt;</span>}
          </div>
  
          <p className="pending-request-card__text">
            wants to join <strong>{clubName}</strong>
          </p>
  
          {request.message && (
            <p className="pending-request-card__message">"{request.message}"</p>
          )}
  
          {request.type && request.type !== "MEMBERSHIP" && (
            <p className="pending-request-card__type">Type: {request.type}</p>
          )}
        </div>
  
        <div className="pending-request-card__actions">
          <button onClick={handleAccept} className="btn btn--success">
            Accept
          </button>
          <button onClick={handleReject} className="btn btn--danger">
            Reject
          </button>
        </div>
      </article>
    );
}