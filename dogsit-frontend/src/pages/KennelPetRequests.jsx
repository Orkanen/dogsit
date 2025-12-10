import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "@/api";
import "@/styles/pages/_kennelPetRequests.scss";

export default function KennelPetRequests() {
  const { requestId } = useParams();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.kennel.getRequests()
      .then(all => {
        const petRequests = all.filter(r => r.type === "PET_LINK" && r.status === "PENDING");
        setRequests(petRequests);
      })
      .finally(() => setLoading(false));
  }, []);

  // Auto-highlight requested card
  useEffect(() => {
    if (requestId && !loading) {
      const el = document.getElementById(`request-${requestId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("highlight");
        setTimeout(() => el.classList.remove("highlight"), 3000);
      }
    }
  }, [requestId, loading, requests]);

  const handleAccept = async (reqId) => {
    if (!confirm("Accept this pet verification?")) return;
    try {
      await api.kennel.acceptRequest(reqId);
      setRequests(prev => prev.filter(r => r.id !== reqId));
      alert("Pet verified and linked to your kennel!");
    } catch {
      alert("Failed to accept");
    }
  };

  const handleReject = async (reqId) => {
    if (!confirm("Reject this verification request?")) return;
    try {
      await api.kennel.rejectRequest(reqId);
      setRequests(prev => prev.filter(r => r.id !== reqId));
    } catch {
      alert("Failed to reject");
    }
  };

  if (loading) return <div className="loader">Loading verification requests…</div>;

  return (
    <section className="kennel-pet-requests">
      <header className="kennel-pet-requests__header">
        <h1>Pet Verification Requests</h1>
        <Link to="/kennel/dashboard" className="back-link">← Back to Dashboard</Link>
      </header>

      <p className="intro">
        These owners believe their dog was bred or registered by your kennel.
      </p>

      {requests.length === 0 ? (
        <div className="empty-state">
          <p>No pending verification requests</p>
          <p className="hint">All quiet on the pedigree front</p>
        </div>
      ) : (
        <div className="request-grid">
          {requests.map(req => (
            <article
              key={req.id}
              id={`request-${req.id}`}
              className="request-card"
            >
              <div className="pet-header">
                <img
                  src={req.pet.images?.[0]?.url || "/placeholder-dog.jpg"}
                  alt={req.pet.name}
                  className="pet-image"
                />
                <div className="pet-info">
                  <h3>{req.pet.name || "Unnamed Pet"}</h3>
                  <p>{req.pet.breed} • {req.pet.sex} • {req.pet.color || "Unknown color"}</p>
                  <p className="owner">
                    Owner: {req.pet.owner.profile?.firstName 
                      ? `${req.pet.owner.profile.firstName} ${req.pet.owner.profile.lastName || ""}`
                      : req.pet.owner.email}
                  </p>
                </div>
              </div>

              {req.message && (
                <div className="message">
                  <strong>Message:</strong> "{req.message}"
                </div>
              )}

              <div className="actions">
                <button onClick={() => handleAccept(req.id)} className="btn btn--success">
                  Accept Verification
                </button>
                <button onClick={() => handleReject(req.id)} className="btn btn--danger">
                  Reject
                </button>
                <Link to={`/pet/${req.pet.id}`} className="btn btn--outline">
                  View Full Profile
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}