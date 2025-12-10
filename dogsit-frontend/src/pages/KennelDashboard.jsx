import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/api";
import { useAuth } from "@/context/AuthContext";
import PendingRequestCard from "@/components/ui/cards/PendingRequestCard";
import "@/styles/pages/_kennelDashboard.scss";

export default function KennelDashboard() {
  const { user } = useAuth();
  const [kennels, setKennels] = useState([]);
  const [requests, setRequests] = useState([]); // Membership + Pet verification
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.kennel.getManagedData();
      setKennels(data.kennels || []);
      setRequests(data.requests || []);
    } catch (err) {
      console.error("Kennel dashboard load error:", err);
      alert("Failed to load kennel data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAcceptRequest = async (reqId) => {
    if (!confirm("Accept this request?")) return;
    try {
      await api.kennel.acceptRequest(reqId);
      loadData();
    } catch {
      alert("Failed to accept");
    }
  };

  const handleRejectRequest = async (reqId) => {
    if (!confirm("Reject this request?")) return;
    try {
      await api.kennel.rejectRequest(reqId);
      loadData();
    } catch {
      alert("Failed to reject");
    }
  };

  if (loading) return <div className="kennel-dashboard__loader">Loading your kennels…</div>;

  if (kennels.length === 0) {
    return (
      <div className="kennel-dashboard__empty">
        <h1>Kennel Dashboard</h1>
        <p>You don't own any kennels yet.</p>
        <Link to="/kennel/create" className="btn btn--primary">Create Your First Kennel</Link>
      </div>
    );
  }

  return (
    <section className="kennel-dashboard">
      <header className="kennel-dashboard__header">
        <h1>Kennel Dashboard</h1>
        <Link to="/">← Back to Home</Link>
      </header>

      {/* My Kennels */}
      <section>
        <h2>My Kennels ({kennels.length})</h2>
        <div className="kennel-grid">
          {kennels.map(k => (
            <Link key={k.id} to={`/kennel/${k.id}`} className="kennel-card">
              <h3>{k.name}</h3>
              <p>{k.dogCount || 0} registered dogs</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Requests */}
      {requests.length > 0 && (
        <section className="kennel-dashboard__requests">
          <h2>Pending Requests ({requests.length})</h2>
          <div className="request-list">
            {requests.map((req) => (
              <PendingRequestCard
                key={req.id}
                request={req}
                onRefresh={loadData}
              />
            ))}
          </div>
        </section>
      )}
    </section>
  );
}