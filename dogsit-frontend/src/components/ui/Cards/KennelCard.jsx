import { Link } from 'react-router-dom';
import "@/styles/components/cards/_kennel-card.scss";

export default function KennelCard({ kennel }) {
  const { id, name, location, memberCount = 0, dogCount = 0 } = kennel;

  return (
    <article className="kennel-card">
      <div className="kennel-card__header">
        <h3 className="kennel-card__name">{name}</h3>
        <p className="kennel-card__location">
          {location || 'Location not set'}
        </p>
      </div>

      <div className="kennel-card__stats">
        <span>{memberCount} Member{memberCount !== 1 ? 's' : ''} Member</span>
        <span>•</span>
        <span>{dogCount} Dog{dogCount !== 1 ? 's' : ''}</span>
      </div>

      <Link to={`/kennel/${id}`} className="kennel-card__link">
        View Details →
      </Link>
    </article>
  );
}