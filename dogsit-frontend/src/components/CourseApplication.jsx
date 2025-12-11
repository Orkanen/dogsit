// src/components/CourseApplication.jsx
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/api";
import "@/styles/components/_courseApplication.scss";

export default function CourseApplication({ course, clubId, isMember, hasPendingRequest, onJoinClub }) {
  const { user } = useAuth();
  const [selectedPetId, setSelectedPetId] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [myPets, setMyPets] = useState([]);

  // Load user's pets when component mounts and user is member
  useEffect(() => {
    if (isMember && user) {
      api.pet.getMyPets().then(pets => setMyPets(pets));
    }
  }, [isMember, user]);

  const handleEnroll = async () => {
    if (!selectedPetId) return alert("Please select a pet");

    setEnrolling(true);
    try {
      await api.courses.enrollPet(course.id, Number(selectedPetId));
      setEnrolled(true);
      alert(`Successfully enrolled ${myPets.find(p => p.id === Number(selectedPetId))?.name} in "${course.title}"!`);
    } catch (err) {
      alert(err.message || "Failed to enroll");
    } finally {
      setEnrolling(false);
    }
  };

  if (!isMember) {
    return (
      <div className="course-application course-application--locked">
        <div className="course-application__header">
          <h4>{course.title}</h4>
          {course.maxParticipants && (
            <span className="course-application__spots">
              {course.enrollments?.filter(e => e.status === "APPROVED").length || 0} / {course.maxParticipants} spots filled
            </span>
          )}
        </div>
        <p className="course-application__description">{course.description || "No description"}</p>
        <div className="course-application__locked-cta">
          <p>Join the club to enroll your pet in this course</p>
          <button onClick={onJoinClub} className="btn btn--primary">
            {hasPendingRequest ? "Request Pending" : "Join Club to Enroll"}
          </button>
        </div>
      </div>
    );
  }

  if (enrolled) {
    return (
      <div className="course-application course-application--enrolled">
        <p>Enrolled successfully!</p>
      </div>
    );
  }

  return (
    <div className="course-application">
      <div className="course-application__header">
        <h4>{course.title}</h4>
        {course.maxParticipants && (
          <span className="course-application__spots">
            {course.enrollments?.filter(e => e.status === "APPROVED").length || 0} / {course.maxParticipants}
          </span>
        )}
      </div>
      <p className="course-application__description">{course.description || "No description"}</p>

      <div className="course-application__form">
        <label>Select your pet:</label>
        <select
          value={selectedPetId}
          onChange={(e) => setSelectedPetId(e.target.value)}
          disabled={enrolling}
        >
          <option value="">Choose a pet...</option>
          {myPets.map(pet => (
            <option key={pet.id} value={pet.id}>
              {pet.name} ({pet.breed || "Unknown breed"})
            </option>
          ))}
        </select>

        <button
          onClick={handleEnroll}
          disabled={!selectedPetId || enrolling}
          className="btn btn--primary"
        >
          {enrolling ? "Enrolling..." : "Enroll Pet"}
        </button>
      </div>
    </div>
  );
}