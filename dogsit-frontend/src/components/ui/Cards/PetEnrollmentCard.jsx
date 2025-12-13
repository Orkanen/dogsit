import { Link } from "react-router-dom";
import { useState } from "react";
import api from "@/api";
import "@/styles/components/cards/_petEnrollmentCard.scss";

export default function PetEnrollmentCard({ enrollment }) {
  const pet = enrollment.pet;
  const course = enrollment.course;
  const status = enrollment.status;

  const [requesting, setRequesting] = useState(false);

  const statusConfig = {
    APPLIED: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Applied" },
    APPROVED: { bg: "bg-green-100", text: "text-green-800", label: "Approved" },
    REJECTED: { bg: "bg-red-100", text: "text-red-800", label: "Rejected" },
  }[status] || { bg: "bg-gray-100", text: "text-gray-800", label: status };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const trainers = course?.certifiers || [];

  // Check if certificate already requested or issued
  const hasCertificate = !!enrollment.certification;

  const handleRequestCertificate = async () => {
    if (!confirm("Request official certificate for this course?")) return;

    setRequesting(true);
    try {
      await api.certifications.request({
        courseId: course.id,
        petId: pet.id,
        enrollmentId: enrollment.id,
        notes: `Completed ${course.title}`,
      });

      alert("Certificate request sent!");
      // Optional: refresh parent data
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    } catch (err) {
      console.error("Certificate request failed:", err);
      const msg = err.message || "Unknown error";
      if (msg.includes("already requested")) {
        alert("You have already requested a certificate for this course.");
      } else {
        alert("Failed to send request: " + msg);
      }
    } finally {
      setRequesting(false);
    }
  };

  return (
    <article className="pet-enrollment-card flex gap-4">
      {/* Pet Avatar */}
      <div className="pet-avatar">
        {pet?.images?.[0]?.url ? (
          <img src={pet.images[0].url} alt={pet.name} />
        ) : (
          <div className="placeholder">Dog</div>
        )}
      </div>

      {/* Info */}
      <div className="info">
        <h3 className="title">
          {pet?.name} → {course?.title}
        </h3>

        <p className="dates">
          Applied: {formatDate(enrollment.appliedAt)}
          {enrollment.processedAt && (
            <> • Processed: {formatDate(enrollment.processedAt)}</>
          )}
        </p>

        {/* Trainers */}
        {trainers.length > 0 && (
          <div className="trainers">
            <strong>Trainer{trainers.length > 1 ? "s" : ""}:</strong>{" "}
            {trainers
              .map((c) => c.user.profile?.firstName || c.user.email)
              .join(", ")}
          </div>
        )}

        <div className="actions">
          <span className={`status-badge ${statusConfig.bg} ${statusConfig.text}`}>
            {statusConfig.label}
          </span>{" "}
          {course?.club && (
            <Link to={`/club/${course.club.id}`} className="club-link">
              View Club
            </Link>
          )}
        </div>

        {/* Certificate Request / Status */}
        {status === "APPROVED" && (
          <div className="certificate-actions mt-3">
            {hasCertificate ? (
              <div className="text-green-700 font-medium flex items-center gap-2">
                Certificate Issued
              </div>
            ) : (
              <button
                onClick={handleRequestCertificate}
                disabled={requesting}
                className="btn btn--success btn--small"
              >
                {requesting ? "Sending..." : "Request Certificate"}
              </button>
            )}
          </div>
        )}

        {/* Rejection note */}
        {status === "REJECTED" && enrollment.notes && (
          <p className="rejection-note mt-2">Note: {enrollment.notes}</p>
        )}
      </div>
    </article>
  );
}