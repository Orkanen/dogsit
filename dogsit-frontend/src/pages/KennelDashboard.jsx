import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/api";
import "@/styles/pages/_kennelDashboard.scss";

export default function KennelDashboard() {
  const [kennels, setKennels] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loadingKennels, setLoadingKennels] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);

  const loadData = async () => {
    try {
      setLoadingKennels(true);
      const kennelRes = await api.getMyKennels();
      setKennels(kennelRes || []);
    } catch (err) {
      console.error("Failed to load kennels:", err);
    } finally {
      setLoadingKennels(false);
    }

    try {
      setLoadingRequests(true);
      const reqRes = await api.getKennelRequests();
      setRequests(reqRes || []);
    } catch (err) {
      console.error("Failed to load requests:", err);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAccept = async (reqId) => {
    if (!confirm("Accept this request?")) return;
    try {
      await api.acceptKennelRequest(reqId);
      loadData();
    } catch {
      alert("Failed to accept request");
    }
  };

  const handleReject = async (reqId) => {
    if (!confirm("Reject this request?")) return;
    try {
      await api.rejectKennelRequest(reqId);
      loadData();
    } catch {
      alert("Failed to reject request");
    }
  };

  return (
    <section className="kennel-dashboard">
      <header className="kennel-dashboard__header">
        <h1 className="kennel-dashboard__title">Kennel Dashboard</h1>
        <Link to="/" className="kennel-dashboard__home-link">
          Back to Home
        </Link>
      </header>

      {/* My Kennels */}
      <section className="kennel-dashboard__kennels">
        <h2 className="kennel-dashboard__section-title">My Kennels</h2>

        {loadingKennels ? (
          <div className="kennel-dashboard__loader">Loading kennels…</div>
        ) : kennels.length === 0 ? (
          <div className="kennel-dashboard__empty">
            <p>
              You don’t have any kennels yet.{" "}
              <Link to="/kennel/create" className="kennel-dashboard__create-link">
                Create your first kennel
              </Link>
            </p>
          </div>
        ) : (
          <div className="kennel-dashboard__kennels-grid">
            {kennels.map((k) => (
              <article key={k.id} className="kennel-dashboard__kennel-card">
                <h3 className="kennel-dashboard__kennel-name">{k.name}</h3>
                {k.location && (
                  <p className="kennel-dashboard__kennel-location">{k.location}</p>
                )}
                <p className="kennel-dashboard__kennel-pets">
                  {k.dogCount || 0} {k.dogCount === 1 ? "dog" : "dogs"} registered
                </p>
                <Link to={`/kennel/${k.id}`} className="kennel-dashboard__kennel-link">
                  View Kennel
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Incoming Requests */}
      <section className="kennel-dashboard__requests">
        <h2 className="kennel-dashboard__section-title">
          Incoming Requests{" "}
          <span className="kennel-dashboard__count">({requests.length})</span>
        </h2>

        {loadingRequests ? (
          <div className="kennel-dashboard__loader">Loading requests…</div>
        ) : requests.length === 0 ? (
          <div className="kennel-dashboard__empty">
            <p>No pending requests</p>
            <p className="kennel-dashboard__empty-hint">
              All quiet on the kennel front
            </p>
          </div>
        ) : (
          <div className="kennel-dashboard__requests-list">
            {requests.map((req) => {
              const isPetLink = req.type === "PET_LINK";
              const isMembership = req.type === "MEMBERSHIP";

              const pet = isPetLink ? req.pet : null;
              const requesterProfile = isPetLink ? pet?.owner?.profile : req.user?.profile;
              const requesterName =
                requesterProfile
                  ? `${requesterProfile.firstName || ""} ${requesterProfile.lastName || ""}`.trim() || "User"
                  : "User";

              const kennelName = req.kennel?.name || "Unknown Kennel";

              const title = isPetLink
                ? `${pet?.name || "A pet"} wants to be verified by ${kennelName}`
                : `${requesterName} wants to join ${kennelName}`;

              const subtitle = isPetLink
                ? `${pet?.breed || "Unknown breed"}${pet?.color ? ` • ${pet?.color}` : ""}`
                : req.user?.email;

              return isPetLink ? (
                // PET VERIFICATION → Clickable card that goes to dedicated page
                <Link
                  key={req.id}
                  to={`/kennel/requests/pet/${req.id}`}
                  className="kennel-dashboard__request kennel-dashboard__request--pet kennel-dashboard__request--clickable"
                >
                  {pet?.images?.[0]?.url ? (
                    <img
                      src={pet.images[0].url}
                      alt={pet.name}
                      className="kennel-dashboard__request-image"
                      loading="lazy"
                    />
                  ) : (
                    <div className="kennel-dashboard__request-avatar">Dog</div>
                  )}

                  <div className="kennel-dashboard__request-info">
                    <h4 className="kennel-dashboard__request-title">{title}</h4>
                    <p className="kennel-dashboard__request-subtitle">{subtitle}</p>
                    {req.message && (
                      <p className="kennel-dashboard__request-message">"{req.message}"</p>
                    )}
                    <span className="kennel-dashboard__view-detail">
                      View full verification request →
                    </span>
                  </div>
                </Link>
              ) : (
                // MEMBERSHIP REQUEST → Keep inline accept/reject
                <article
                  key={req.id}
                  className="kennel-dashboard__request kennel-dashboard__request--member"
                >
                  <div className="kennel-dashboard__request-avatar">Person</div>

                  <div className="kennel-dashboard__request-info">
                    <h4 className="kennel-dashboard__request-title">{title}</h4>
                    <p className="kennel-dashboard__request-subtitle">{subtitle}</p>
                    {req.message && (
                      <p className="kennel-dashboard__request-message">"{req.message}"</p>
                    )}
                  </div>

                  <div className="kennel-dashboard__request-actions">
                    <button
                      onClick={() => handleAccept(req.id)}
                      className="kennel-dashboard__btn kennel-dashboard__btn--accept"
                      disabled={req.status !== "PENDING"}
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleReject(req.id)}
                      className="kennel-dashboard__btn kennel-dashboard__btn--reject"
                      disabled={req.status !== "PENDING"}
                    >
                      Reject
                    </button>
                  </div>

                  {req.status !== "PENDING" && (
                    <span className={`kennel-dashboard__status-badge kennel-dashboard__status--${req.status.toLowerCase()}`}>
                      {req.status}
                    </span>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </section>
  );
}