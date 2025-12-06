import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "@/api";
import { useAuth } from "@/context/AuthContext";
import ClubCard from "../components/ui/Cards/ClubCard";
import "@/styles/pages/_clubPage.scss";

export default function ClubPage() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.club.getClubById(id);
        setClub(data);
      } catch (err) {
        console.error("Failed to load club:", err);
        setError("Club not found or unavailable");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return <div className="club-page__loading">Loading club…</div>;
  }

  if (error || !club) {
    return (
      <div className="club-page__error">
        <p className="club-page__error-title">{error || "Club not found"}</p>
        <Link to="/clubs" className="btn btn--primary">← Back to Clubs</Link>
      </div>
    );
  }

  const acceptedMembers = club.members?.filter(m => m.status === "ACCEPTED") || [];
  const currentMember = acceptedMembers.find(m => m.userId === user?.id);
  const isOwner = currentMember?.role === "OWNER";
  const isEmployee = currentMember?.role === "EMPLOYEE";
  const isMember = !!currentMember;
  const hasPendingRequest = club.members?.some(m => m.userId === user?.id && m.status === "PENDING");
  const isOwnerOrEmployee = isOwner || isEmployee;

  const handleJoin = async () => {
    if (!isAuthenticated) return navigate("/login");
    try {
      await api.club.joinClub(club.id);
      alert("Request sent!");
      setClub(prev => ({ ...prev, hasPendingRequest: true }));
    } catch (err) {
      alert(err.message || "Failed to send request");
    }
  };

  return (
    <div className="club-page">
      <div className="club-page__card-wrapper">
        <ClubCard club={club} showViewButton={false} />
      </div>

      <div className="club-page__status">
        {isOwner && <p className="club-page__status-text club-page__status--owner">You are the Owner</p>}
        {isEmployee && <p className="club-page__status-text club-page__status--employee">You are an Employee</p>}
        {isMember && !isOwner && !isEmployee && <p className="club-page__status-text club-page__status--member">You are a Member</p>}
        {hasPendingRequest && <p className="club-page__status-text club-page__status--pending">Your membership request is pending</p>}
      </div>

      {!isMember && !hasPendingRequest && (
        <div className="club-page__join">
          <button onClick={handleJoin} className="btn btn--primary btn--large">
            {isAuthenticated ? "Request to Join" : "Log in to Join"}
          </button>
        </div>
      )}

      {isOwnerOrEmployee && (
        <div className="club-page__dashboard-link">
          <Link to="/club/dashboard" className="btn btn--primary btn--large">
            Go to Club Dashboard →
          </Link>
        </div>
      )}

      <footer className="club-page__footer">
        <Link to="/clubs" className="club-page__back-link">
          ← Back to all clubs
        </Link>
      </footer>
    </div>
  );
}