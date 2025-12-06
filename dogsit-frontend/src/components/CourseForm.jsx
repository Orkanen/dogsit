import { useEffect, useState } from "react";
import api from "@/api";
import "@/styles/components/_courseForm.scss";

export default function CourseForm({ issuerType = "CLUB", issuerId = null, ownedClubs = [], onSave = () => {} }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [clubs, setClubs] = useState(Array.isArray(ownedClubs) ? ownedClubs.slice() : []);
  const [clubId, setClubId] = useState(issuerId || (ownedClubs[0]?.id ?? ""));
  const [members, setMembers] = useState([]);
  const [certifierUserId, setCertifierUserId] = useState("");
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  // Load club if issuerId provided but not in list
  useEffect(() => {
    let mounted = true;
    if (!issuerId || clubs.some(c => Number(c.id) === Number(issuerId))) return;

    const loadClub = async () => {
      try {
        const clubData = await api.club.getClubById(issuerId);
        if (mounted && clubData) {
          setClubs(prev => [...prev, { id: clubData.id, name: clubData.name }]);
          setClubId(clubData.id);
        }
      } catch (err) {
        console.error("Failed to load club for form", err);
      }
    };
    loadClub();
    return () => { mounted = false; };
  }, [issuerId, clubs]);

  // Load members when club selected
  useEffect(() => {
    const loadMembers = async () => {
      if (!clubId) {
        setMembers([]);
        return;
      }
      setLoadingMembers(true);
      try {
        const clubData = await api.club.getClubById(clubId);
        const eligible = (clubData.members || [])
          .filter(m => m.status === "ACCEPTED" && ["OWNER", "EMPLOYEE"].includes(m.role))
          .map(m => ({
            id: m.user?.id || m.userId,
            name: `${m.user?.profile?.firstName || ""} ${m.user?.profile?.lastName || ""}`.trim() || m.user?.email || "Unknown",
            role: m.role
          }))
          .filter(m => m.id);
        setMembers(eligible);
      } catch (err) {
        setMessage("Failed to load members");
      } finally {
        setLoadingMembers(false);
      }
    };
    loadMembers();
  }, [clubId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!title.trim()) return setMessage("Title is required");
    if (!clubId) return setMessage("Please select a club");

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        issuerType: "CLUB",
        issuerId: Number(clubId),
        certifierUserId: certifierUserId ? Number(certifierUserId) : null,
      };

      await api.courses.createCourse(payload);
      setMessage("Course created successfully!");

      if (onSave) await onSave();
      setTitle("");
      setDescription("");
      setCertifierUserId("");
    } catch (err) {
      setMessage(err.message || "Failed to create course");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="course-form" onSubmit={handleSubmit}>
      <div className="course-form__field">
        <label className="course-form__label">Club</label>
        <select
          value={clubId || ""}
          onChange={(e) => setClubId(e.target.value)}
          className="course-form__select"
        >
          <option value="">Select a club</option>
          {clubs.map(club => (
            <option key={club.id} value={club.id}>
              {club.name}
            </option>
          ))}
        </select>
      </div>

      <div className="course-form__field">
        <label className="course-form__label">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="course-form__input"
          placeholder="e.g. Advanced Obedience Level 3"
          required
        />
      </div>

      <div className="course-form__field">
        <label className="course-form__label">Description (optional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="course-form__textarea"
          rows={4}
          placeholder="Describe what this course covers..."
        />
      </div>

      <div className="course-form__field">
        <label className="course-form__label">Certifier (optional)</label>
        {loadingMembers ? (
          <p className="course-form__loading">Loading members…</p>
        ) : members.length === 0 ? (
          <p className="course-form__empty">No eligible members found</p>
        ) : (
          <select
            value={certifierUserId}
            onChange={(e) => setCertifierUserId(e.target.value)}
            className="course-form__select"
          >
            <option value="">Nominate later</option>
            {members.map(m => (
              <option key={m.id} value={m.id}>
                {m.name} {m.role ? `(${m.role})` : ""}
              </option>
            ))}
          </select>
        )}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="course-form__submit"
      >
        {submitting ? "Creating…" : "Create Course"}
      </button>

      {message && (
        <p className={`course-form__message ${message.includes("success") ? "course-form__message--success" : "course-form__message--error"}`}>
          {message}
        </p>
      )}
    </form>
  );
}