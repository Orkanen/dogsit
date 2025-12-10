import { Link } from "react-router-dom";
import api from "@/api";

export default function PendingRequestCard({ request, onRefresh }) {
  const isPetRequest = request.type === "PET_LINK";
  const isMembership = request.type === "MEMBERSHIP" || !request.type;

  const requesterName = isPetRequest
    ? request.pet?.owner?.profile
      ? `${request.pet.owner.profile.firstName} ${request.pet.owner.profile.lastName || ""}`.trim()
      : request.pet?.owner?.email
    : request.user?.profile
      ? `${request.user.profile.firstName} ${request.user.profile.lastName || ""}`.trim()
      : request.user?.email;

  const targetName = request.kennel?.name || request.club?.name || "Unknown";

  const handleAccept = async () => {
    try {
      if (isPetRequest) {
        await api.kennel.acceptRequest(request.id);
      } else if (request.clubId) {
        await api.club.acceptMember(request.clubId, request.user.id);
      }
      onRefresh();
    } catch (err) {
      alert("Accept failed: " + (err.message || ""));
    }
  };

  const handleReject = async () => {
    try {
      if (isPetRequest) {
        await api.kennel.rejectRequest(request.id);
      } else if (request.clubId) {
        await api.club.rejectMember(request.clubId, request.user.id);
      }
      onRefresh();
    } catch (err) {
      alert("Reject failed: " + (err.message || ""));
    }
  };

  return (
    <article className="pending-request-card">
      <div className="pending-request-card__avatar">
        {isPetRequest && request.pet?.images?.[0]?.url ? (
          <img src={request.pet.images[0].url} alt={request.pet.name} />
        ) : (
          <div className="avatar-placeholder">User</div>
        )}
      </div>

      <div className="pending-request-card__info">
        <h4>
          <strong>{requesterName || "Someone"}</strong> wants to{" "}
          {isPetRequest ? "verify pet with" : "join"} <strong>{targetName}</strong>
        </h4>

        {isPetRequest && request.pet && (
          <p>
            Pet: <strong>{request.pet.name}</strong> ({request.pet.breed})
            {" • "}
            <Link to={`/pet/${request.pet.id}`}>View Pet</Link>
          </p>
        )}

        {request.message && (
          <p className="message">"{request.message}"</p>
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