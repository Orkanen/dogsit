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

  const isOwner = user && pet?.ownerId === user.id;

  useEffect(() => {
    const fetchPet = async () => {
      try {
        const data = await api.getPet(id);
        setPet(data);

        // Load kennel if officially verified
        if (data.kennelId) {
          const k = await api.getKennelById(data.kennelId);
          setKennel(k);
        }

        // Only check for pending/rejected requests if owner
        if (isOwner && !data.kennelId) {
          const requests = await api.getMyOutgoingPetVerificationRequests();
          const req = requests.find(r => r.pet.id === parseInt(id));
          if (req) {
            setVerificationStatus(req.status); // "PENDING" or "REJECTED"
          }
        }
      } catch (err) {
        console.error("Failed to load pet:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPet();
  }, [id, user]);

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