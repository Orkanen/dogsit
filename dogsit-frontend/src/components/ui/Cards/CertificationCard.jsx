import { Link } from "react-router-dom";
import "@/styles/components/cards/_certificateCard.scss";

export default function CertificateCard({ cert }) {
  const course = cert.course;
  const issuingClub = cert.issuingClub;
  const trainer = cert.verifiedByUser;

  return (
    <div className="certificate-badge">
      <div className="certificate-badge__icon">Certificate</div>
      <div className="certificate-badge__content">
        {/* REAL COURSE TITLE — this is what matters */}
        <h4 className="certificate-badge__title">
          {course?.title || "Course Certification"}
        </h4>

        {/* Club */}
        {issuingClub && (
          <p className="certificate-badge__detail">
            <strong>Club:</strong>{" "}
            <Link to={`/club/${issuingClub.id}`} className="certificate-badge__link">
              {issuingClub.name}
            </Link>
          </p>
        )}

        {/* Trainer who approved it */}
        {trainer && (
          <p className="certificate-badge__detail">
            <strong>Trainer:</strong>{" "}
            <span className="certificate-badge__trainer">
              {trainer.profile?.firstName} {trainer.profile?.lastName || trainer.email}
            </span>
          </p>
        )}

        {/* Issued Date */}
        <p className="certificate-badge__detail certificate-badge__date">
          Issued{" "}
          {new Date(cert.issuedAt).toLocaleDateString(undefined, {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>
    </div>
  );
}