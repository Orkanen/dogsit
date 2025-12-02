import { useState } from "react";
import api from "@/api";
import "@/styles/components/_courseForm.scss";

export default function CourseForm({ course, onSave, ownedKennels = [] }) {
  const [title, setTitle] = useState(course?.title || "");
  const [description, setDescription] = useState(course?.description || "");
  const [selectedKennelId, setSelectedKennelId] = useState(course?.kennelId || ownedKennels[0]?.id || "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (!course && !selectedKennelId) {
      alert("Please select a kennel");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
      };

      if (!course) {
        payload.issuerType = "KENNEL";
        payload.issuerId = Number(selectedKennelId);
        payload.clubId = null;
      }

      if (course) {
        await api.updateCourse(course.id, payload);
      } else {
        await api.createCourse(payload);
      }

      setTitle("");
      setDescription("");
      setSelectedKennelId(ownedKennels[0]?.id || "");
      onSave?.();
    } catch (err) {
      console.error(err);
      alert("Failed to save course: " + (err.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  if (!course && ownedKennels.length === 0) {
    return <p>You don't own any kennels yet.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="course-form">
      {!course && ownedKennels.length > 0 && (
        <select
          value={selectedKennelId}
          onChange={(e) => setSelectedKennelId(e.target.value)}
          required
        >
          <option value="">-- Select Kennel --</option>
          {ownedKennels.map((k) => (
            <option key={k.id} value={k.id}>
              {k.name}
            </option>
          ))}
        </select>
      )}

      <input
        type="text"
        placeholder="Course Title (e.g. Champion Bloodline Certificate)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        disabled={saving}
      />
      <textarea
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        disabled={saving}
      />
      <button type="submit" disabled={saving}>
        {saving ? "Saving..." : course ? "Update" : "Create Course"}
      </button>
    </form>
  );
}