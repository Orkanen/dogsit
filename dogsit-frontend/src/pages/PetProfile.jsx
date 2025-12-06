import { useEffect, useState } from "react";
import { useLocation, useParams, Link } from "react-router-dom";
import api from "@/api";
import { useAuth } from "@/context/AuthContext";
import "@/styles/pages/_petProfile.scss";

export default function PetProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const [pet, setPet] = useState(null);
  const [kennel, setKennel] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const [verificationStatus, setVerificationStatus] = useState(null); // null | "PENDING" | "REJECTED"

  // New state for courses + certification request flow
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [pendingRequest, setPendingRequest] = useState(null); // locally track latest request for this pet
  const [requesting, setRequesting] = useState(false);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [error, setError] = useState(null);

  const isOwner = user && pet?.ownerId === user.id;

  useEffect(() => {
    const fetchPet = async () => {
      try {
        const data = await api.pet.getPet(id);
        setPet(data);

        // Load kennel if officially verified
        if (data.kennelId) {
          const k = await api.kennel.getKennelById(data.kennelId);
          setKennel(k);
        }

        // Only check for pending/rejected link requests if owner
        if (isOwner && !data.kennelId) {
          const requests = await api.pet.getMyOutgoingPetVerificationRequests();
          const req = requests.find(r => r.pet.id === parseInt(id));
          if (req) {
            setVerificationStatus(req.status); // "PENDING" or "REJECTED"
          }
        }

        // Fetch issuable courses for the current user (so owner can request a certification)
        // This call will populate possible courses for this pet (from clubs/kennels user belongs to)
        try {
          setCoursesLoading(true);
          const c = await api.courses.getMyIssuableCourses();
          setCourses(c || []);
          if ((c || []).length > 0) setSelectedCourseId((c[0] && c[0].id) || null);
        } catch (err) {
          // Non-fatal: just leave courses empty
          console.warn("Failed to load issuable courses:", err);
        } finally {
          setCoursesLoading(false);
        }
      } catch (err) {
        console.error("Failed to load pet:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  const handleRequestCertification = async () => {
    setError(null);
    if (!selectedCourseId) {
      setError("Please select a course before requesting a certification.");
      return;
    }
    setRequesting(true);
    try {
      const payload = {
        courseId: selectedCourseId,
        targetType: "PET",
        targetId: pet.id,
      };
      const created = await api.certification.requestCertification(payload);
      // backend returns created certification (status PENDING)
      setPendingRequest(created);
    } catch (err) {
      console.error("Request certification failed:", err);
      setError(err.message || "Failed to request certification");
    } finally {
      setRequesting(false);
    }
  };

  if (loading) return <div className="pet-profile__loader">Loading…</div>;
  if (!pet) return <div className="pet-profile__not-found">Pet not found</div>;

  const hasOfficialKennel = !!pet.kennelId;

  const from = location.state?.from;
  const backLink = from === "kennel-requests" ? "/kennel/requests/pet" :
                   from === "kennel-dashboard" ? "/kennel/dashboard" :
                   "/pets/my";

  const backText = from === "kennel-requests" ? "← Back to Verification Requests" :
                   from === "kennel-dashboard" ? "← Back to Kennel Dashboard" :
                   "← Back to My Pets";

  return (
    <article className="pet-profile">
      <header className="pet-profile__header">
        <div className="pet-profile__info">
          <h1 className="pet-profile__name">{pet.name || "Unnamed Pet"}</h1>
          <p className="pet-profile__subtitle">
            {pet.breed || "Unknown breed"} • {pet.age ? `${pet.age} years` : "Age unknown"}
          </p>
        </div>

        {isOwner && (
          <Link to={`/pets/${pet.id}/edit`} className="pet-profile__btn pet-profile__btn--edit">
            Edit Pet
          </Link>
        )}
      </header>

      <div className="pet-profile__hero">
        {pet.images?.[0]?.url ? (
          <img src={pet.images[0].url} alt={pet.name} className="pet-profile__image" />
        ) : (
          <div className="pet-profile__placeholder">No photo</div>
        )}
      </div>

      <section className="pet-profile__details">
        <InfoItem label="Sex" value={pet.sex} />
        <InfoItem label="Color" value={pet.color} />
        <InfoItem
          label="Owner"
          value={
            pet.owner?.profile?.firstName
              ? `${pet.owner.profile.firstName} ${pet.owner.profile.lastName || ""}`.trim()
              : pet.owner?.email || "Unknown"
          }
        />

        {/* VERIFIED KENNEL BADGE */}
        <div className="pet-profile__kennel-status">
          <strong>Kennel of Origin:</strong>{" "}
          {hasOfficialKennel ? (
            <Link to={`/kennel/${kennel.id}`} className="pet-profile__kennel-link">
              {kennel.name} ({kennel.location || "Location unknown"})
              <span className="badge badge--verified">Officially Verified</span>
            </Link>
          ) : verificationStatus === "PENDING" ? (
            <span className="badge badge--pending">Verification Request Pending</span>
          ) : verificationStatus === "REJECTED" ? (
            <span className="badge badge--rejected">Verification Request Rejected</span>
          ) : (
            <span className="text-muted">Not registered with any kennel</span>
          )}
        </div>
      </section>

      {/* CERTIFICATIONS SECTION */}
      <section className="pet-profile__certifications">
        <h3 className="pet-profile__section-title">Certifications</h3>

        {/* Owner: Request certification UI */}
        {isOwner && (
          <div className="pet-profile__request-cert">
            <h4>Request a Certification for this Pet</h4>

            {coursesLoading ? (
              <div className="text-muted">Loading available courses…</div>
            ) : courses.length === 0 ? (
              <div className="text-muted">No courses available for you to request at this time.</div>
            ) : (
              <div className="pet-profile__request-form">
                <label htmlFor="course-select">Select course</label>
                <select
                  id="course-select"
                  value={selectedCourseId ?? ""}
                  onChange={(e) => setSelectedCourseId(Number(e.target.value))}
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} ({c.issuerType === "CLUB" ? c.club?.name : c.kennel?.name})
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleRequestCertification}
                  className="pet-profile__btn"
                  disabled={requesting}
                >
                  {requesting ? "Requesting…" : "Request Certification"}
                </button>

                {error && <div className="text-error">{error}</div>}
                {pendingRequest && pendingRequest.status === "PENDING" && (
                  <div className="badge badge--pending" style={{ marginTop: 8 }}>
                    Certification request submitted — pending verification
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {pet.certifications?.length > 0 ? (
          <div className="pet-profile__cert-list">
            {pet.certifications
              .filter(c => c.status === "APPROVED")
              .map((cert) => (
                <div key={cert.id} className="pet-profile__cert-badge">
                  <span className="pet-profile__cert-icon">Certificate</span>
                  <div>
                    <strong>{cert.course.title}</strong>
                    <p className="pet-profile__cert-issuer">
                      Issued by {cert.issuingKennel?.name || cert.issuingClub?.name || "Unknown Issuer"}
                      {cert.issuedAt && ` • ${new Date(cert.issuedAt).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-muted">No certifications yet</p>
        )}
      </section>

      <div className="pet-profile__footer">
        <Link to={backLink} className="pet-profile__back-link">
          {backText}
        </Link>
      </div>
    </article>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="pet-profile__info-item">
      <strong>{label}:</strong> <span>{value || "—"}</span>
    </div>
  );
}