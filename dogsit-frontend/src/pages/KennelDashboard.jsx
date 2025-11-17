import { useEffect, useState } from "react";
import api from "../lib/api";
import { Link } from "react-router-dom";

const buttonStyle = {
  padding: "0.5rem 1rem",
  borderRadius: "0.375rem",
  border: "none",
  cursor: "pointer",
  fontWeight: "500",
};

export default function KennelDashboard() {
  const [kennels, setKennels] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [kennelRes, reqRes] = await Promise.all([
        api.getMyKennels(),        // you’ll add this
        api.getKennelRequests(),   // already in backend
      ]);
      setKennels(kennelRes);
      setRequests(reqRes);
    } catch (err) {
      alert("Failed to load kennel data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAccept = async (reqId) => {
    if (!confirm("Accept this pet into your kennel?")) return;
    try {
      await api.acceptKennelRequest(reqId);
      loadData();
    } catch (err) {
      alert("Failed to accept");
    }
  };

  const handleReject = async (reqId) => {
    if (!confirm("Reject this request?")) return;
    try {
      await api.rejectKennelRequest(reqId);
      loadData();
    } catch (err) {
      alert("Failed to reject");
    }
  };

  return (
    <div style={{ maxWidth: "64rem", margin: "0 auto", padding: "1rem" }}>
      <h1 style={{ fontSize: "1.875rem", fontWeight: "bold", marginBottom: "1.5rem" }}>
        Kennel Dashboard
      </h1>

      {/* Your Kennels */}
      <section style={{ marginBottom: "3rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "1rem" }}>
          My Kennels
        </h2>
        {kennels.length === 0 ? (
          <p>No kennels yet. <Link to="/kennel/create" style={{ color: "#1d4ed8" }}>Create one</Link></p>
        ) : (
          <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
            {kennels.map(k => (
              <div key={k.id} style={{ border: "1px solid #d1d5db", borderRadius: "0.5rem", padding: "1rem" }}>
                <h3 style={{ fontWeight: "600", fontSize: "1.25rem" }}>{k.name}</h3>
                <p style={{ color: "#6b7280" }}>{k.pets?.length || 0} pets</p>
                <Link to={`/kennel/${k.id}`} style={{ color: "#1d4ed8", textDecoration: "underline" }}>
                  View Kennel →
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Incoming Requests */}
      <section>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "1rem" }}>
          Pet Link Requests ({requests.length})
        </h2>

        {loading && <p>Loading requests...</p>}

        {requests.length === 0 ? (
          <p style={{ color: "#6b7280" }}>No pending requests</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {requests.map(req => {
            const isPetRequest = req.type === "PET_LINK";
            const isMembershipRequest = req.type === "MEMBERSHIP";

            // For pet requests → use pet + owner
            const pet = isPetRequest ? req.pet : null;
            const requesterProfile = isPetRequest 
                ? pet?.owner?.profile 
                : req.user?.profile; // for membership requests

            const requesterName = requesterProfile 
                ? `${requesterProfile.firstName || ""} ${requesterProfile.lastName || ""}`.trim() || "Unknown User"
                : "Unknown User";

            const title = isPetRequest 
                ? `${pet?.name || "Unnamed Pet"} wants to be linked to your kennel`
                : `${requesterName} wants to join your kennel`;

            const subtitle = isPetRequest
                ? `${pet?.species} • ${pet?.breed}`
                : req.user?.email;

            return (
                <div
                key={req.id}
                style={{
                    border: "1px solid #d1d5db",
                    borderRadius: "0.5rem",
                    padding: "1rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: isPetRequest ? "#f0fdf4" : "#fefce8", // visual distinction
                }}
                >
                <div>
                    <strong>{title}</strong>
                    <p style={{ margin: "0.5rem 0", color: "#6b7280", fontSize: "0.875rem" }}>
                    {subtitle}
                    </p>
                    {isPetRequest && pet && (
                    <Link to={`/pet/${pet.id}`} style={{ fontSize: "0.875rem", color: "#1d4ed8" }}>
                        View Pet Profile →
                    </Link>
                    )}
                    {isMembershipRequest && (
                    <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                        Membership Request
                    </span>
                    )}
                </div>

                <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                    onClick={() => handleAccept(req.id)}
                    style={{ ...buttonStyle, background: "#16a34a", color: "white" }}
                    >
                    Accept
                    </button>
                    <button
                    onClick={() => handleReject(req.id)}
                    style={{ ...buttonStyle, background: "#dc2626", color: "white" }}
                    >
                    Reject
                    </button>
                </div>
                </div>
            );
            })}
          </div>
        )}
      </section>

      <div style={{ marginTop: "2rem" }}>
        <Link to="/" style={{ color: "#1d4ed8" }}>← Back to Home</Link>
      </div>
    </div>
  );
}