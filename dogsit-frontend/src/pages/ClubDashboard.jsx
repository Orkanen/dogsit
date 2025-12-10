import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/api";
import { useAuth } from "@/context/AuthContext";
import CourseForm from "@/components/CourseForm";
import CompetitionForm from "@/components/CompetitionForm";
import PendingRequestCard from "@/components/ui/Cards/PendingRequestCard";
import CourseCard from "@/components/ui/cards/CourseCard";
import CompetitionCard from "@/components/ui/cards/CompetitionCard";
import ClubCard from "../components/ui/Cards/ClubCard";
import "@/styles/pages/_clubDashboard.scss";

export default function ClubDashboard() {
  const { user } = useAuth();

  const [myClubs, setMyClubs] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [allCompetitions, setAllCompetitions] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadEverything = async () => {
    setLoading(true);
    try {
      const data = await api.club.getManagedData();
      setMyClubs(data.clubs || []);
      setAllCourses(data.courses || []);
      setAllCompetitions(data.competitions || []);
      setRequests([
        ...(data.requests?.membership || []),
        ...(data.requests?.enrollments || []),
        ...(data.requests?.entries || [])
      ]);
    } catch (err) {
      console.error("Failed to load dashboard", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEverything();
  }, []);

  const isOwnerOf = (item) => {
    return myClubs.some(club => 
      club.id === item.clubId && 
      club.members?.some(m => m.userId === user?.id && m.role === "OWNER")
    );
  };

  if (loading) return <div className="club-dashboard__loader">Loading your empire…</div>;

  if (myClubs.length === 0) {
    return (
      <div className="club-dashboard__empty">
        <h1 className="club-dashboard__title">Welcome to Club Control Center</h1>
        <p>You don't manage any clubs yet.</p>
        <p className="club-dashboard__empty-hint">
          Create your first club and start building your legacy
        </p>
        <Link to="/club/create" className="club-dashboard__create-link">
          Create Your First Club
        </Link>
      </div>
    );
  }

  return (
    <section className="club-dashboard">
      <header className="club-dashboard__header">
        <h1 className="club-dashboard__title">Club Control Center</h1>
        <Link to="/" className="club-dashboard__home-link">← Back to Home</Link>
      </header>

      {/* MY CLUBS */}
      <section className="club-dashboard__kennels">
        <h2 className="club-dashboard__section-title">My Clubs</h2>
        <div className="club-dashboard__kennels-grid">
          {myClubs.map(club => (
            <ClubCard key={club.id} club={club} />
          ))}
        </div>
      </section>

      {/* PENDING REQUESTS */}
      {requests.length > 0 && (
        <section className="club-dashboard__requests">
          <h2 className="club-dashboard__section-title">
            Incoming Requests <span className="club-dashboard__count">({requests.length})</span>
          </h2>
          <div className="club-dashboard__requests-list">
            {requests.map(req => (
              <PendingRequestCard key={req.id} request={req} onRefresh={loadEverything} />
            ))}
          </div>
        </section>
      )}

      {/* CREATE FORMS */}
      <section className="club-dashboard__courses">
        <h2 className="club-dashboard__section-title">
          Create New Content
        </h2>
        <div className="courses-list">
          <div className="course-item">
            <strong>Create Course</strong>
            <CourseForm ownedClubs={myClubs} onSave={loadEverything} />
          </div>
          <div className="course-item">
            <strong>Create Competition</strong>
            <CompetitionForm ownedClubs={myClubs} onSave={loadEverything} />
          </div>
        </div>
      </section>

      {/* ALL COURSES */}
      <section className="club-dashboard__courses">
        <h2 className="club-dashboard__section-title">
          All Courses <span className="club-dashboard__count">({allCourses.length})</span>
        </h2>
        {allCourses.length === 0 ? (
          <div className="club-dashboard__empty">
            <p>No courses created yet</p>
          </div>
        ) : (
          <div className="courses-list">
            {allCourses.map(course => (
              <CourseCard
                key={course.id}
                course={course}
                isOwner={isOwnerOf(course)}
                onSave={loadEverything}
                onDelete={loadEverything}
              />
            ))}
          </div>
        )}
      </section>

      {/* ALL COMPETITIONS */}
      <section className="club-dashboard__courses">
        <h2 className="club-dashboard__section-title">
          All Competitions <span className="club-dashboard__count">({allCompetitions.length})</span>
        </h2>
        {allCompetitions.length === 0 ? (
          <div className="club-dashboard__empty">
            <p>No competitions yet</p>
          </div>
        ) : (
          <div className="courses-list">
            {allCompetitions.map(comp => (
              <CompetitionCard
                key={comp.id}
                competition={comp}
                isOwner={isOwnerOf(comp)}
                onSave={loadEverything}
                onDelete={loadEverything}
              />
            ))}
          </div>
        )}
      </section>
    </section>
  );
}