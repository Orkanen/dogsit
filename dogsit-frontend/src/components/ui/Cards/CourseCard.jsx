import { useState } from "react";
import { Link } from "react-router-dom";
import api from "@/api";
import "@/styles/components/cards/_course-card.scss";

export default function CourseCard({ course, isOwner, clubMembers = [], onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(course);
  const [loading, setLoading] = useState(false);

  const participantCount = local.enrollments?.filter(e => e.status === "APPROVED").length || 0;
  const isFull = local.maxParticipants ? participantCount >= local.maxParticipants : false;

  const updateLocal = (updates) => {
    const updated = { ...local, ...updates };
    setLocal(updated);
    onUpdate(updated); // optimistic update in parent
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = {
        title: local.title.trim(),
        description: local.description?.trim() || null,
        startDate: local.startDate || null,
        endDate: local.endDate || null,
        maxParticipants: local.maxParticipants || null,
        isHidden: local.isHidden,
        isAvailable: local.isAvailable,
        unavailableReason: local.isAvailable ? null : local.unavailableReason?.trim() || null,
      };

      const updated = await api.courses.update(local.id, payload);
      setLocal(updated);
      onUpdate(updated);
      setEditing(false);
    } catch (err) {
      alert(err.message || "Failed to save course");
    } finally {
      setLoading(false);
    }
  };

  const toggleHidden = async () => {
    try {
      const updated = await api.courses.toggleHidden(local.id);
      updateLocal({ isHidden: updated.isHidden });
    } catch {
      alert("Failed to toggle visibility");
    }
  };

  const toggleAvailable = async () => {
    if (local.isAvailable && !confirm("Mark as unavailable?")) return;
    const reason = !local.isAvailable ? prompt("Reason (optional):") : null;
    try {
      const updated = await api.courses.setAvailable(local.id, !local.isAvailable, reason || undefined);
      updateLocal({
        isAvailable: updated.isAvailable,
        unavailableReason: updated.unavailableReason,
      });
    } catch {
      alert("Failed to toggle availability");
    }
  };

  const assignTrainer = async (userId) => {
    try {
      const assignment = await api.courses.assignTrainer(local.id, userId);
      updateLocal({ certifiers: [...local.certifiers, assignment] });
    } catch {
      alert("Failed to assign trainer");
    }
  };

  const removeTrainer = async (userId) => {
    if (!confirm("Remove this trainer?")) return;
    try {
      await api.courses.removeTrainer(local.id, userId);
      updateLocal({ certifiers: local.certifiers.filter(c => c.user.id !== userId) });
    } catch {
      alert("Failed to remove trainer");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete course permanently?")) return;
    try {
      await api.courses.delete(local.id);
      onDelete(local.id);
    } catch {
      alert("Failed to delete course");
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
    <div className={`course-card ${local.isHidden ? "course-card--hidden" : ""}`}>
      <h3>{local.title}</h3>
      {local.description && <p>{local.description}</p>}

      <div className="meta">
        <span>Club: {local.club.name}</span>
        <span>Participants: {participantCount}{local.maxParticipants ? ` / ${local.maxParticipants}` : ""}</span>
        {local.certifiers?.length > 0 && (
          <div>
            Trainers: {local.certifiers.map(c => c.user.profile?.firstName || c.user.email).join(", ")}
          </div>
        )}
        <div className="badges">
          {local.isHidden && <span className="badge badge--gray">Hidden</span>}
          {!local.isAvailable && <span className="badge badge--red">Unavailable</span>}
          {isFull && <span className="badge badge--orange">Full</span>}
        </div>
      </div>

      <Link to={`/course/${local.id}/manage`} className="btn btn--primary">
        Manage Enrollments
      </Link>

      {isOwner && (
        <div className="actions">
          <button onClick={() => setEditing(true)}>Edit</button>
          <button onClick={handleDelete} className="danger">Delete</button>
          <button onClick={toggleHidden}>{local.isHidden ? "Show" : "Hide"}</button>
          <button onClick={toggleAvailable}>{local.isAvailable ? "Unavailable" : "Available"}</button>

          <select onChange={e => e.target.value && assignTrainer(Number(e.target.value))} defaultValue="">
            <option value="">+ Add Trainer</option>
            {clubMembers
              .filter(m => !local.certifiers?.some(c => c.user.id === m.user.id))
              .map(m => (
                <option key={m.user.id} value={m.user.id}>
                  {m.user.profile?.firstName} {m.user.profile?.lastName}
                </option>
              ))}
          </select>

          {local.certifiers?.map(c => (
            <button key={c.user.id} onClick={() => removeTrainer(c.user.id)} className="small danger">
              × {c.user.profile?.firstName}
            </button>
          ))}

          <Link to={`/course/${local.id}/issue-certificate`} className="btn btn--success">
            Issue Certificates
          </Link>
        </div>
      )}
    </div>
  );
}