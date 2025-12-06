import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "@/api";
import "@/styles/pages/_kennelPetRequests.scss";

export default function KennelPetRequests() {
  const { requestId } = useParams(); // e.g. /kennel/requests/pet/123
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.kennel.getKennelPetRequests()
      .then(setRequests)
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  }, []);

  // Auto-scroll + highlight the specific request
  useEffect(() => {
    if (requestId && !loading && requests.length > 0) {
      const el = document.getElementById(`request-${requestId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("highlight");
        setTimeout(() => el.classList.remove("highlight"), 3000);
      }
    }
  }, [requestId, loading, requests]);

  const handleRespond = async (requestId, status) => {
    if (!confirm(`Are you sure you want to ${status.toLowerCase()} this request?`)) return;

    try {
      const updated = await api.kennel.acceptKennelRequest(requestId); // uses unified endpoint
      if (status === "REJECTED") await api.kennel.rejectKennelRequest(requestId);

      setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status } : r));
      if (status === "ACCEPTED") alert("Pet officially linked to your kennel!");
    } catch (err) {
      alert("Failed: " + (err.message || "Unknown error"));
    }
  };

  if (loading) return <div className="loader">Loading requests…</div>;

  return (
    <section className="kennel-pet-requests">
      <header className="kennel-pet-requests__header">
        <h1>Pet Verification Requests</h1>
        <Link to="/kennel/dashboard" className="back-link">← Back to Dashboard</Link>
      </header>

      <p className="kennel-pet-requests__intro">
        Owners asking you to confirm their dog was bred or registered by your kennel.
      </p>

      {requests.length === 0 ? (
        <p className="empty">No pending verification requests</p>
      ) : (
        <div className="request-list">
          {requests.map(req => (
            <div
              key={req.id}
              id={`request-${req.id}`}
              className={`request-card ${Number(requestId) === req.id ? "request-card--active" : ""}`}
            >
              <div className="request-card__pet">
                <img
                  src={req.pet.images?.[0]?.url || "/placeholder-dog.jpg"}
                  alt={req.pet.name}
                  className="request-card__img"
                />
                <div>
                  <strong>{req.pet.name || "Unnamed Pet"}</strong>
                  <br />
                  {req.pet.breed} • {req.pet.sex} • {req.pet.color}
                  <br />
                  <small>
                    Owner: {req.pet.owner.profile?.firstName 
                      ? `${req.pet.owner.profile.firstName} ${req.pet.owner.profile.lastName || ""}`
                      : req.pet.owner.email}
                  </small>
                </div>
              </div>

              {req.message && (
                <div className="request-card__message">
                  "{req.message}"
                </div>
              )}

              <div className="request-card__actions">
                <button
                  onClick={() => handleRespond(req.id, "ACCEPTED")}
                  className="btn btn--success"
                  disabled={req.status !== "PENDING"}
                >
                  Accept
                </button>
                <button
                  onClick={() => handleRespond(req.id, "REJECTED")}
                  className="btn btn--danger"
                  disabled={req.status !== "PENDING"}
                >
                  Reject
                </button>
                <Link 
                    to={`/pets/${req.pet.id}`} 
                    className="btn btn--outline"
                    state={{ from: "kennel-requests" }}
                    >
                    View Pet
                </Link>
              </div>

              {req.status !== "PENDING" && (
                <span className={`badge badge--${req.status.toLowerCase()}`}>
                  {req.status}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}