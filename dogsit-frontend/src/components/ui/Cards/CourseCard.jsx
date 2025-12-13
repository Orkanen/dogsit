import { useState } from "react";
import { Link } from "react-router-dom";
import api from "@/api";
import "@/styles/components/cards/_course-card.scss";

export default function CourseCard({ course, isOwner, clubMembers = [], onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(course);
  const [loading, setLoading] = useState(false);

  // Safely compute participant count – preserve original if update doesn't return enrollments
  const participantCount = (() => {
    // Prefer local (after edit)
    if (local.enrollments) {
      return local.enrollments.filter(e => e.status === "APPROVED").length;
    }
    // Fallback to original prop (before any edit)
    if (course.enrollments) {
      return course.enrollments.filter(e => e.status === "APPROVED").length;
    }
    return 0;
  })();

  const isFull = local.maxParticipants ? participantCount >= local.maxParticipants : false;

  const updateLocal = (updates) => {
    const updated = { ...local, ...updates };
    setLocal(updated);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = {
        title: local.title.trim(),
        description: local.description?.trim() || null,
        maxParticipants: local.maxParticipants || null,
        isHidden: local.isHidden,
        isAvailable: local.isAvailable,
        unavailableReason: local.isAvailable ? null : local.unavailableReason?.trim() || null,
      };

      const updated = await api.courses.update(local.id, payload);
      setLocal(prev => ({ ...prev, ...updated }));
      onUpdate({ ...local, ...updated });
      setEditing(false);
    } catch (err) {
      console.error("Save failed:", err);
      alert(err.message || "Failed to save course");
    } finally {
      setLoading(false);
    }
  };

  const toggleHidden = async () => {
    try {
      const updated = await api.courses.toggleHidden(local.id);
      updateLocal({ isHidden: updated.isHidden });
    } catch (err) {
      console.error("Toggle hidden failed:", err);
      alert("Failed to toggle visibility");
    }
  };

  const toggleAvailable = async () => {
    try {
      const updated = await api.courses.setAvailable(local.id, !local.isAvailable);
      updateLocal({
        isAvailable: updated.isAvailable,
        unavailableReason: updated.unavailableReason,
      });
    } catch (err) {
      console.error("Toggle available failed:", err);
      alert("Failed to toggle availability");
    }
  };

  // assignTrainer / removeTrainer unchanged (already fixed in previous version)
  const assignTrainer = async (userId) => {
    try {
      const updatedCourse = await api.courses.assignTrainer(local.id, userId);
      updateLocal({ certifiers: updatedCourse.certifiers });
    } catch (err) {
      console.error("Assign trainer failed:", err);
      alert("Failed to assign trainer");
    }
  };

  const removeTrainer = async (userId) => {
    if (!confirm("Remove this trainer?")) return;
    try {
      const updatedCourse = await api.courses.removeTrainer(local.id, userId);
      updateLocal({ certifiers: updatedCourse.certifiers });
    } catch (err) {
      console.error("Remove trainer failed:", err);
      alert("Failed to remove trainer");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete course permanently?")) return;
    try {
      await api.courses.delete(local.id);
      onDelete(local.id);
    } catch (err) {
      alert("Failed to delete course");
    }
  };

  if (editing) {
    return (
      <div className="course-card course-card--editing">
        <h3>Edit Course</h3>
        <input
          value={local.title}
          onChange={(e) => updateLocal({ title: e.target.value })}
          placeholder="Title"
        />
        <textarea
          value={local.description || ""}
          onChange={(e) => updateLocal({ description: e.target.value })}
          placeholder="Description"
          rows={4}
        />
        <input
          type="number"
          value={local.maxParticipants || ""}
          onChange={(e) => updateLocal({ maxParticipants: e.target.value ? Number(e.target.value) : null })}
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
        <span>Course Participants: {participantCount}{local.maxParticipants ? ` / ${local.maxParticipants}` : ""}</span>
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
          <button onClick={toggleAvailable}>
            {local.isAvailable ? "Mark Unavailable" : "Mark Available"}
          </button>

          <select onChange={e => e.target.value && assignTrainer(Number(e.target.value))} value="">
            <option value="">+ Add Trainer</option>
            {clubMembers
              .filter(m => !local.certifiers?.some(c => c.user.id === m.user.id))
              .map(m => (
                <option key={m.user.id} value={m.user.id}>
                  {m.user.profile?.firstName || ""} {m.user.profile?.lastName || m.user.email}
                </option>
              ))}
          </select>

          {local.certifiers?.map(c => (
            <button key={c.user.id} onClick={() => removeTrainer(c.user.id)} className="small danger">
              × {c.user.profile?.firstName || c.user.email}
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