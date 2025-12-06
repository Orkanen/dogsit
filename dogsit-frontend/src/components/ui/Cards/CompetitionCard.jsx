import { useState } from "react";
import api from "@/api";
import { Link } from "react-router-dom";
import "@/styles/components/cards/_competition-card.scss";

export default function CompetitionCard({ competition, isOwner, onSave, onDelete }) {
    const [editing, setEditing] = useState(false);
    const [title, setTitle] = useState(competition.title);
    const [description, setDescription] = useState(competition.description || "");
    const [startAt, setStartAt] = useState(
      competition.startAt ? new Date(competition.startAt).toISOString().slice(0, 10) : ""
    );
  
    const handleSave = async () => {
      try {
        await api.competitions.updateCompetition(competition.id, { title, description, startAt });
        onSave();
        setEditing(false);
      } catch (err) {
        alert(err.message || "Failed to update competition");
      }
    };
  
    const handleDelete = async () => {
      if (!confirm("Delete this competition permanently?")) return;
      await api.competitions.deleteCompetition(competition.id);
      onDelete();
    };
  
    if (editing) {
      return (
        <div className="competition-card competition-card--editing">
          <h3 className="competition-card__title">Edit Competition</h3>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="competition-card__input competition-card__input--title"
            placeholder="Competition title"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="competition-card__input competition-card__input--description"
            placeholder="Description (optional)"
            rows={4}
          />
          <input
            type="date"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
            className="competition-card__input competition-card__input--date"
          />
          <div className="competition-card__actions">
            <button onClick={handleSave} className="btn btn--success">Save Changes</button>
            <button onClick={() => setEditing(false)} className="btn btn--secondary">Cancel</button>
          </div>
        </div>
      );
    }
  
    return (
      <div className="competition-card">
        <h3 className="competition-card__title">{competition.title}</h3>
        {competition.description && <p className="competition-card__description">{competition.description}</p>}
        <div className="competition-card__meta">
          <span className="competition-card__club">Club: {competition.club.name}</span>
          <span className="competition-card__date">
            Starts: {competition.startAt ? new Date(competition.startAt).toLocaleDateString() : "TBD"}
          </span>
        </div>
  
        <div className="competition-card__manage">
          <Link to={`/competition/${competition.id}/manage`} className="btn btn--primary btn--large">
            Manage & Award Prizes
          </Link>
        </div>
  
        {isOwner && (
          <div className="competition-card__actions">
            <button onClick={() => setEditing(true)} className="btn btn--secondary">Edit</button>
            <button onClick={handleDelete} className="btn btn--danger">Delete</button>
            <button className="btn btn--primary">Add Awarder</button>
            <button className="btn btn--primary">Add Award</button>
          </div>
        )}
      </div>
    );
  }