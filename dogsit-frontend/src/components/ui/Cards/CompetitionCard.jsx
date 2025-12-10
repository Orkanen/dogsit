import { useState } from "react";
import { Link } from "react-router-dom";
import api from "@/api";
import "@/styles/components/cards/_competition-card.scss";

export default function CompetitionCard({ competition, isOwner, clubMembers = [], onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(competition);
  const [loading, setLoading] = useState(false);

  const entryCount = local.entries?.filter(e => e.status === "ACCEPTED").length || 0;
  const isFull = local.maxEntries ? entryCount >= local.maxEntries : false;
  const awarders = local.allowedAwarders?.filter(a => a.status === "ACCEPTED") || [];

  const updateLocal = (updates) => {
    const updated = { ...local, ...updates };
    setLocal(updated);
    onUpdate(updated);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = {
        title: local.title.trim(),
        description: local.description?.trim() || null,
        startAt: local.startAt || null,
        endAt: local.endAt || null,
        maxEntries: local.maxEntries || null,
        isHidden: local.isHidden,
        isAvailable: local.isAvailable,
        unavailableReason: local.isAvailable ? null : local.unavailableReason?.trim() || null,
      };
      const updated = await api.competition.update(local.id, payload);
      updateLocal(updated);
      setEditing(false);
    } catch {
      alert("Failed to save competition");
    } finally {
      setLoading(false);
    }
  };

  const toggleHidden = async () => {
    try {
      const updated = await api.competition.toggleHidden(local.id);
      updateLocal({ isHidden: updated.isHidden });
    } catch {
      alert("Failed to toggle visibility");
    }
  };

  const toggleAvailable = async () => {
    if (local.isAvailable && !confirm("Mark as unavailable?")) return;
    const reason = !local.isAvailable ? prompt("Reason (optional):") : null;
    try {
      const updated = await api.competition.setAvailable(local.id, !local.isAvailable, reason || undefined);
      updateLocal({
        isAvailable: updated.isAvailable,
        unavailableReason: updated.unavailableReason,
      });
    } catch {
      alert("Failed to toggle availability");
    }
  };

  const nominateAwarder = async (userId) => {
    try {
      const nom = await api.competition.nominateAwarder(local.id, userId);
      updateLocal({ allowedAwarders: [...local.allowedAwarders, nom] });
    } catch {
      alert("Failed to nominate awarder");
    }
  };

  const removeAwarder = async (userId) => {
    if (!confirm("Remove awarder?")) return;
    try {
      await api.competition.processAwarder(local.id, userId, "REJECT");
      updateLocal({ allowedAwarders: local.allowedAwarders.filter(a => a.user.id !== userId) });
    } catch {
      alert("Failed to remove awarder");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete competition permanently?")) return;
    try {
      await api.competition.delete(local.id);
      onDelete(local.id);
    } catch {
      alert("Failed to delete competition");
    }
  };

  if (editing) {
    return (
      <div className="course-card course-card--editing">
        <h3>Edit Course</h3>
        <input value={local.title} onChange={e => updateLocal({ title: e.target.value })} placeholder="Title" required />
        <textarea
          value={local.description || ""}
          onChange={e => updateLocal({ description: e.target.value })}
          placeholder="Description"
          rows={4}
        />
        <input
          type="date"
          value={local.startDate ? local.startDate.slice(0, 10) : ""}
          onChange={e => updateLocal({ startDate: e.target.value || null })}
        />
        <input
          type="date"
          value={local.endDate ? local.endDate.slice(0, 10) : ""}
          onChange={e => updateLocal({ endDate: e.target.value || null })}
        />
        <input
          type="number"
          value={local.maxParticipants || ""}
          onChange={e => updateLocal({ maxParticipants: e.target.value ? Number(e.target.value) : null })}
          placeholder="Max participants"
        />
        <div className="actions">
          <button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </button>
          <button onClick={() => setEditing(false)}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`competition-card ${local.isHidden ? "competition-card--hidden" : ""}`}>
      <h3>{local.title}</h3>
      {local.description && <p>{local.description}</p>}

      <div className="meta">
        <span>Club: {local.club.name}</span>
        <span>Entries: {entryCount}{local.maxEntries ? ` / ${local.maxEntries}` : ""}</span>
        {awarders.length > 0 && (
          <div>
            Awarders: {awarders.map(a => a.user.profile?.firstName || a.user.email).join(", ")}
          </div>
        )}
        <div className="badges">
          {local.isHidden && <span className="badge badge--gray">Hidden</span>}
          {!local.isAvailable && <span className="badge badge--red">Unavailable</span>}
          {isFull && <span className="badge badge--orange">Full</span>}
          <span className="badge badge--status">{local.status}</span>
        </div>
      </div>

      <Link to={`/competition/${local.id}/manage`} className="btn btn--primary btn--large">
        Manage Entries & Awards
      </Link>

      {isOwner && (
        <div className="actions">
          <button onClick={() => setEditing(true)}>Edit</button>
          <button onClick={handleDelete} className="danger">Delete</button>
          <button onClick={toggleHidden}>{local.isHidden ? "Show" : "Hide"}</button>
          <button onClick={toggleAvailable}>{local.isAvailable ? "Unavailable" : "Available"}</button>

          <select onChange={e => e.target.value && nominateAwarder(Number(e.target.value))}>
            <option value="">+ Nominate Awarder</option>
            {clubMembers
              .filter(m => !awarders.some(a => a.user.id === m.user.id))
              .map(m => (
                <option key={m.user.id} value={m.user.id}>
                  {m.user.profile?.firstName} {m.user.profile?.lastName}
                </option>
              ))}
          </select>

          {awarders.map(a => (
            <button key={a.user.id} onClick={() => removeAwarder(a.user.id)} className="small danger">
              × {a.user.profile?.firstName}
            </button>
          ))}

          <Link to={`/competition/${local.id}/results`} className="btn btn--success">
            Manage Awards & Results
          </Link>
        </div>
      )}
    </div>
  );
}