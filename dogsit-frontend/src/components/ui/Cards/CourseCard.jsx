import { useState } from "react";
import api from "@/api";
import "@/styles/components/cards/_course-card.scss";

export default function CourseCard({ course, isOwner, onSave, onDelete }) {
    const [editing, setEditing] = useState(false);
    const [title, setTitle] = useState(course.title);
    const [description, setDescription] = useState(course.description || "");
  
    const handleSave = async () => {
      try {
        await api.courses.updateCourse(course.id, { title, description });
        onSave();
        setEditing(false);
      } catch (err) {
        alert(err.message || "Failed to update course");
      }
    };
  
    const handleDelete = async () => {
      if (!confirm("Delete this course permanently?")) return;
      await api.courses.deleteCourse(course.id);
      onDelete();
    };
  
    if (editing) {
      return (
        <div className="course-card course-card--editing">
          <h3 className="course-card__title">Edit Course</h3>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="course-card__input course-card__input--title"
            placeholder="Course title"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="course-card__input course-card__input--description"
            placeholder="Description (optional)"
            rows={4}
          />
          <div className="course-card__actions">
            <button onClick={handleSave} className="btn btn--success">Save Changes</button>
            <button onClick={() => setEditing(false)} className="btn btn--secondary">Cancel</button>
          </div>
        </div>
      );
    }
  
    return (
      <div className="course-card">
        <h3 className="course-card__title">{course.title}</h3>
        {course.description && <p className="course-card__description">{course.description}</p>}
        <div className="course-card__meta">
          <span className="course-card__club">Club: {course.club.name}</span>
          {course.certifier && (
            <span className="course-card__certifier">
              Certifier: {course.certifier.profile?.firstName} {course.certifier.profile?.lastName}
            </span>
          )}
        </div>
  
        {isOwner && (
          <div className="course-card__actions">
            <button onClick={() => setEditing(true)} className="btn btn--secondary">Edit</button>
            <button onClick={handleDelete} className="btn btn--danger">Delete</button>
            <button className="btn btn--primary">Add Certifier</button>
            <button className="btn btn--primary">Issue Certificate</button>
          </div>
        )}
      </div>
    );
  }