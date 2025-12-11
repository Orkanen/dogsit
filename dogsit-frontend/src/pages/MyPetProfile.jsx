import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import api from "@/api";
import ConfirmModal from "@/components/ui/RevokeConfirmModal";
import PetEnrollmentCard from "../components/ui/Cards/PetEnrollmentCard";
import "@/styles/pages/_myPetProfile.scss";

export default function MyPetProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const [pet, setPet] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [kennel, setKennel] = useState(null);
  const [kennels, setKennels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedKennelId, setSelectedKennelId] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Editing state
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ breed: "", sex: "", color: "", age: "" });
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        setLoading(true);

        const [petData, allKennels, enrollmentData] = await Promise.all([
          api.pet.getPetById(id),
          api.kennel.getKennels(),
          api.courses.getMyEnrollments(), // Now includes petId filter
        ]);

        // Security check
        if (petData.ownerId !== user.id) {
          window.location.replace(`/pets/${id}`);
          return;
        }

        setPet(petData);
        setKennels(allKennels);

        // Filter enrollments for THIS pet only
        const petEnrollments = enrollmentData.filter(
          (e) => e.petId === Number(id)
        );
        setEnrollments(petEnrollments);

        // Initialize edit form
        setEditData({
          breed: petData.breed || "",
          sex: petData.sex || "",
          color: petData.color || "",
          age: petData.age || "",
        });

        // Load verified kennel if exists
        if (petData.kennelId) {
          try {
            const k = await api.kennel.getKennelById(petData.kennelId);
            setKennel(k);
          } catch {
            console.warn("Failed to load verified kennel");
          }
        }

        // Check pending kennel verification
        try {
          const requests = await api.kennel.getRequests();
          const hasPending = requests.some(
            (r) => r.type === "PET_LINK" && r.pet?.id === Number(id) && r.status === "PENDING"
          );
          setHasPendingRequest(hasPending);
        } catch (err) {
          console.warn("Could not check pending requests:", err);
        }
      } catch (err) {
        console.error("Failed to load pet profile:", err);
        alert("Failed to load pet. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, user]);

  const handleRequestVerification = async () => {
    if (!selectedKennelId) return alert("Please select a kennel");
    if (!confirm(`Send verification request for ${pet.name}?`)) return;

    setRequestLoading(true);
    try {
      await api.kennel.requestPetLink(
        Number(selectedKennelId),
        Number(id),
        `Please verify that ${pet.name} was born or registered in your kennel.`
      );
      setHasPendingRequest(true);
      setSelectedKennelId("");
      alert("Verification request sent!");
    } catch (err) {
      alert(err.message || "Failed to send request");
    } finally {
      setRequestLoading(false);
    }
  };

  const handleRemoveVerification = async () => {
    if (!confirm("Are you sure? This cannot be undone.")) return;

    try {
      await api.kennel.removePetVerification(pet.id);
      setPet((prev) => ({ ...prev, kennelId: null }));
      setKennel(null);
      alert("Verification removed");
    } catch (err) {
      alert("Failed: " + (err.message || "Unknown error"));
    } finally {
      setModalOpen(false);
    }
  };

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleSaveEdit = async () => {
    setEditLoading(true);
    try {
      const updatedPet = await api.pet.updatePet(id, editData);
      setPet(updatedPet);
      setEditing(false);
      alert("Pet details updated!");
    } catch (err) {
      alert(err.message || "Failed to update pet");
    } finally {
      setEditLoading(false);
    }
  };

  if (loading) return <div className="loader">Loading…</div>;
  if (!pet) return <div>Pet not found</div>;

  const hasVerification = !!pet.kennelId;

  return (
    <article className="my-pet-profile">
      <header className="my-pet-profile__header">
        <Link to="/my-pets" className="back-link">
          Back to My Pets
        </Link>
        <h1>{pet.name}</h1>
      </header>

      <div className="my-pet-profile__hero">
        <img
          src={pet.images?.[0]?.url || "/placeholder-dog.jpg"}
          alt={pet.name}
          className="pet-hero-image"
        />
      </div>

      <section className="my-pet-profile__details">
        {editing ? (
          <div className="edit-form">
            <p><strong>Breed:</strong> <input name="breed" value={editData.breed} onChange={handleEditChange} /></p>
            <p><strong>Sex:</strong>
              <select name="sex" value={editData.sex} onChange={handleEditChange}>
                <option value="">Select</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </p>
            <p><strong>Color:</strong> <input name="color" value={editData.color} onChange={handleEditChange} /></p>
            <p><strong>Age:</strong> <input name="age" type="number" value={editData.age} onChange={handleEditChange} /></p>
            <div className="edit-actions">
              <button onClick={handleSaveEdit} disabled={editLoading} className="btn btn--primary">
                {editLoading ? "Saving..." : "Save Changes"}
              </button>
              <button onClick={() => setEditing(false)} className="btn btn--outline">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <p><strong>Breed:</strong> {pet.breed || "—"}</p>
            <p><strong>Sex:</strong> {pet.sex || "—"}</p>
            <p><strong>Color:</strong> {pet.color || "—"}</p>
            <p><strong>Age:</strong> {pet.age ? `${pet.age} years` : "—"}</p>
            <button onClick={() => setEditing(true)} className="btn btn--outline">
              Edit Details
            </button>
          </>
        )}

        {/* KENNEL VERIFICATION */}
        <div className="my-pet-profile__verification">
          <strong>Kennel Verification:</strong>
          {hasVerification ? (
            <div className="verified">
              <span className="badge badge--success">Verified</span>
              <Link to={`/kennel/${kennel?.id}`} className="kennel-link">
                {kennel?.name} {kennel?.location && `(${kennel.location})`}
              </Link>
              <button
                onClick={() => setModalOpen(true)}
                className="btn btn--danger-outline btn--small"
              >
                Remove
              </button>
            </div>
          ) : hasPendingRequest ? (
            <p className="text-warning">Verification request pending…</p>
          ) : (
            <div className="not-verified">
              <p>Was <strong>{pet.name}</strong> born in a registered kennel?</p>
              <select
                value={selectedKennelId}
                onChange={(e) => setSelectedKennelId(e.target.value)}
                className="select"
              >
                <option value="">Select kennel…</option>
                {kennels.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.name} {k.location && `(${k.location})`}
                  </option>
                ))}
              </select>
              {selectedKennelId && (
                <button
                  onClick={handleRequestVerification}
                  disabled={requestLoading}
                  className="btn btn--primary btn--small"
                >
                  {requestLoading ? "Sending…" : "Request Verification"}
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* COURSE ENROLLMENTS */}
      <section className="my-pet-profile__enrollments">
        <h2 className="section-title">Course Enrollments</h2>
        {enrollments.length === 0 ? (
          <p className="empty-state">
            {pet.name} is not enrolled in any courses yet.
          </p>
        ) : (
          <div className="enrollments-grid">
            {enrollments.map((enrollment) => (
              <PetEnrollmentCard
                key={enrollment.id}
                enrollment={enrollment}
              />
            ))}
          </div>
        )}
      </section>

      <div className="my-pet-profile__actions">
        <Link to={`/pets/${pet.id}`} className="btn btn--outline-underline">
          View Public Profile
        </Link>
      </div>

      <ConfirmModal
        isOpen={modalOpen}
        title="Remove Kennel Verification"
        message={
          <>
            <p>Remove official verification from <strong>{pet.name}</strong>?</p>
            <p>This action cannot be undone.</p>
          </>
        }
        confirmText="Yes, Remove"
        danger={true}
        onConfirm={handleRemoveVerification}
        onCancel={() => setModalOpen(false)}
      />
    </article>
  );
}