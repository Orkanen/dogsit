import { Link } from "react-router-dom";
import "@/styles/components/cards/_clubCard.scss";

export default function ClubCard({ club, showViewButton = true }) {
  if (!club) return null;

  // Only count ACCEPTED members
  const acceptedMembers = club.members?.filter(m => m.status === "ACCEPTED") || [];
  const memberCount = acceptedMembers.length;

  return (
    <article className="club-card">
      <div className="club-card__header">
        <h3 className="club-card__name">{club.name}</h3>
        <p className="club-card__meta">{club.membershipType || "Club"}</p>
      </div>

      <div className="club-card__stats">
        <span>
          <strong>{memberCount}</strong> member{memberCount !== 1 ? "s" : ""}
        </span>
      </div>

      {showViewButton && (
        <Link to={`/club/${club.id}`} className="club-card__link">
          View Club →
        </Link>
      )}
    </article>
  );
}