import { useState, useEffect } from "react";
import api from "@/api";
import "@/styles/components/_certificationRequest.scss";

export default function CertificationRequest({ petId, petName }) {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load only courses from kennels/clubs where user is member or owner
  useEffect(() => {
    const loadMyIssuableCourses = async () => {
      try {
        const data = await api.getMyIssuableCourses(); // ← NEW ENDPOINT (see below)
        setCourses(data || []);
      } catch (err) {
        console.error("Failed to load available courses:", err);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };
    loadMyIssuableCourses();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCourseId) return;

    setSaving(true);
    try {
      await api.requestCertification({
        courseId: Number(selectedCourseId),
        targetType: "PET",
        targetId: petId,
        notes: notes || null,
      });

      alert(`Certification request sent for ${petName || "your pet"}!`);
      setSelectedCourseId("");
      setNotes("");
    } catch (err) {
      alert("Failed to send request: " + (err.message || "Please try again"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="certification-request">
        <p>Loading your available certifications…</p>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="certification-request">
        <h3>Request Official Certification</h3>
        <p className="certification-request__empty">
          You don't have access to any certification courses yet.
          <br />
          Only kennel or club owners/members can issue certifications.
        </p>
      </div>
    );
  }

  return (
    <div className="certification-request">
      <h3>Request Official Certification</h3>
      <p className="certification-request__subtitle">
        Get {petName || "your pet"} officially certified in training, health, or breeding standards.
      </p>

      <form onSubmit={handleSubmit} className="certification-request__form">
        <div className="form-group">
          <label htmlFor="course">Choose Certification</label>
          <select
            id="course"
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            required
          >
            <option value="">Select a certification course…</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.kennel?.name || course.club?.name} — {course.title}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="notes">Notes (optional)</label>
          <textarea
            id="notes"
            placeholder="E.g., completed with top marks, very well-behaved"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        <button
          type="submit"
          disabled={saving || !selectedCourseId}
          className="btn btn--primary"
        >
          {saving ? "Sending Request…" : "Request Certification"}
        </button>
      </form>
    </div>
  );
}