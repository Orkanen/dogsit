import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/api";
import "@/styles/pages/_kennelDashboard.scss";
import CourseForm from "@/components/CourseForm";
import { useAuth } from "@/context/AuthContext";

export default function KennelDashboard() {
  const { user } = useAuth();
  const [kennels, setKennels] = useState([]);
  const [requests, setRequests] = useState([]);         // Kennel membership + pet verification
  const [pendingCerts, setPendingCerts] = useState([]); // Certification requests
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const ownedKennels = kennels.filter(k =>
    k.members?.some(m => m.userId === user?.id && m.role === "OWNER") ||
    k.myRole === "OWNER"
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [kennelRes, reqRes, coursesRes, pendingRes] = await Promise.all([
        api.getMyKennels(),
        api.getKennelRequests(),
        api.getMyIssuableCourses(),
        api.getPendingCertifications(),
      ]);

      setKennels(kennelRes || []);
      setRequests(reqRes || []);
      setCourses(coursesRes || []);
      setPendingCerts(pendingRes || []);
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCertAction = async (id, action) => {
    if (!confirm(`Are you sure you want to ${action} this certification?`)) return;
    try {
      if (action === "approve") {
        await api.approveCertification(id);
      } else {
        await api.rejectCertification(id);
      }
      loadData();
    } catch {
      alert(`Failed to ${action} certification`);
    }
  };

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

  const totalPending = requests.length + pendingCerts.length;

  return (
    <section className="kennel-dashboard">
      <header className="kennel-dashboard__header">
        <h1 className="kennel-dashboard__title">Kennel Dashboard</h1>
        <Link to="/" className="kennel-dashboard__home-link">Back to Home</Link>
      </header>

      {/* My Courses */}
      <section className="kennel-dashboard__courses">
        <h2>My Certification Courses {courses.length > 0 && `(${courses.length})`}</h2>
        <CourseForm ownedKennels={ownedKennels} onSave={loadData} />
        {courses.length > 0 && (
          <div className="courses-list">
            {courses.map(c => (
              <div key={c.id} className="course-item">
                <strong>{c.title}</strong>
                <p>{c.description || "No description"}</p>
                <small>Issued by: {c.kennel?.name || c.club?.name}</small>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* My Kennels */}
      <section className="kennel-dashboard__kennels">
        <h2 className="kennel-dashboard__section-title">My Kennels</h2>
        {loading ? (
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
            {kennels.map(k => (
              <article key={k.id} className="kennel-dashboard__kennel-card">
                <h3 className="kennel-dashboard__kennel-name">{k.name}</h3>
                {k.location && <p className="kennel-dashboard__kennel-location">{k.location}</p>}
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

      {/* UNIFIED INCOMING REQUESTS (Membership + Pet Verification + Certifications) */}
      <section className="kennel-dashboard__requests">
        <h2 className="kennel-dashboard__section-title">
          Incoming Requests <span className="kennel-dashboard__count">({totalPending})</span>
        </h2>

        {loading ? (
          <div className="kennel-dashboard__loader">Loading requests…</div>
        ) : totalPending === 0 ? (
          <div className="kennel-dashboard__empty">
            <p>No pending requests</p>
            <p className="kennel-dashboard__empty-hint">All quiet on the kennel front</p>
          </div>
        ) : (
          <div className="kennel-dashboard__requests-list">

            {/* 1. Kennel Membership & Pet Verification Requests */}
            {requests.map((req) => {
              const isPetLink = req.type === "PET_LINK";
              const pet = isPetLink ? req.pet : null;
              const requesterProfile = isPetLink ? pet?.owner?.profile : req.user?.profile;
              const requesterName = requesterProfile
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
                <Link
                  key={req.id}
                  to={`/kennel/requests/pet/${req.id}`}
                  className="kennel-dashboard__request kennel-dashboard__request--pet kennel-dashboard__request--clickable"
                >
                  {pet?.images?.[0]?.url ? (
                    <img src={pet.images[0].url} alt={pet.name} className="kennel-dashboard__request-image" loading="lazy" />
                  ) : (
                    <div className="kennel-dashboard__request-avatar">Dog</div>
                  )}
                  <div className="kennel-dashboard__request-info">
                    <h4 className="kennel-dashboard__request-title">{title}</h4>
                    <p className="kennel-dashboard__request-subtitle">{subtitle}</p>
                    {req.message && <p className="kennel-dashboard__request-message">"{req.message}"</p>}
                    <span className="kennel-dashboard__view-detail">View full verification request</span>
                  </div>
                </Link>
              ) : (
                <article key={req.id} className="kennel-dashboard__request kennel-dashboard__request--member">
                  <div className="kennel-dashboard__request-avatar">Person</div>
                  <div className="kennel-dashboard__request-info">
                    <h4 className="kennel-dashboard__request-title">{title}</h4>
                    <p className="kennel-dashboard__request-subtitle">{subtitle}</p>
                    {req.message && <p className="kennel-dashboard__request-message">"{req.message}"</p>}
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

            {/* 2. Certification Requests */}
            {pendingCerts.map((cert) => (
              <article
                key={`cert-${cert.id}`}
                className="kennel-dashboard__request kennel-dashboard__request--cert"
              >
                <div className="kennel-dashboard__request-avatar">Certificate</div>

                <div className="kennel-dashboard__request-info">
                  <h4 className="kennel-dashboard__request-title">
                    Certification Request: <strong>{cert.course.title}</strong>
                  </h4>
                  <p className="kennel-dashboard__request-subtitle">
                    {cert.pet
                      ? `${cert.pet.name} (${cert.pet.breed || "Unknown breed"})`
                      : `${cert.user.profile.firstName} ${cert.user.profile.lastName || ""}`
                    }
                  </p>
                  {cert.notes && (
                    <p className="kennel-dashboard__request-message">"{cert.notes}"</p>
                  )}
                  <p className="kennel-dashboard__request-meta">
                    Requested {new Date(cert.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="kennel-dashboard__request-actions">
                  <button
                    onClick={() => handleCertAction(cert.id, "approve")}
                    className="kennel-dashboard__btn kennel-dashboard__btn--accept"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleCertAction(cert.id, "reject")}
                    className="kennel-dashboard__btn kennel-dashboard__btn--reject"
                  >
                    Reject
                  </button>
                </div>
              </article>
            ))}

          </div>
        )}
      </section>
    </section>
  );
}