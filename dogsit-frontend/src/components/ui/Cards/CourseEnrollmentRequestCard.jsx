import { Link } from "react-router-dom";
import api from "@/api";

export default function CourseEnrollmentRequestCard({ enrollment, onRefresh }) {
  const userName = enrollment.user?.profile
    ? `${enrollment.user.profile.firstName} ${enrollment.user.profile.lastName || ""}`.trim()
    : enrollment.user?.email || "Unknown User";

  const petName = enrollment.pet?.name || "Unknown Pet";

  const handleAccept = async () => {
    try {
      await api.courses.processEnrollment(enrollment.id, "APPROVE");
      onRefresh();
    } catch (err) {
      alert("Accept failed: " + (err.message || ""));
    }
  };

  const handleReject = async () => {
    try {
      await api.courses.processEnrollment(enrollment.id, "REJECT");
      onRefresh();
    } catch (err) {
      alert("Reject failed: " + (err.message || ""));
    }
  };

  return (
    <article className="pending-request-card">
      <div className="pending-request-card__avatar">
        {enrollment.pet?.images?.[0]?.url ? (
          <img src={enrollment.pet.images[0].url} alt={petName} />
        ) : (
          <div className="avatar-placeholder">Dog</div>
        )}
      </div>

      <div className="pending-request-card__info">
        <h4>
          <strong>{userName}</strong> wants to enroll{" "}
          <strong>{petName}</strong> in course{" "}
          <strong>{enrollment.course?.title}</strong>
        </h4>
        <p>
          <Link to={`/pet/${enrollment.pet?.id}`}>View Pet Profile</Link>
        </p>
      </div>

      <div className="pending-request-card__actions">
        <button onClick={handleAccept} className="btn btn--success">Accept</button>
        <button onClick={handleReject} className="btn btn--danger">Reject</button>
      </div>
    </article>
  );
}