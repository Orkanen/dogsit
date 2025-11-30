import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import api from "@/api";
import ConfirmModal from "@/components/ui/RevokeConfirmModal";
import "@/styles/pages/_myPetProfile.scss";
import CertificationRequest from "@/components/CertificationRequest";

export default function MyPetProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const [pet, setPet] = useState(null);
  const [kennel, setKennel] = useState(null);
  const [kennels, setKennels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedKennelId, setSelectedKennelId] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [petData, allKennels, requests] = await Promise.all([
          api.getPet(id),
          api.getKennels(),
          api.getKennelRequests?.() || [], // fallback if not available
        ]);

        if (petData.ownerId !== user.id) {
          return window.location.replace(`/pets/${id}`);
        }

        setPet(petData);
        setKennels(allKennels);

        // Check for pending request for this pet
        const pending = requests.some(
          r => r.type === "PET_LINK" && r.pet.id === parseInt(id) && r.status === "PENDING"
        );
        setHasPendingRequest(pending);

        if (petData.kennelId) {
          const k = await api.getKennelById(petData.kennelId);
          setKennel(k);
        }
      } catch (err) {
        console.error("Failed to load data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, user]);

  const handleRequestVerification = async () => {
    if (!selectedKennelId) return;
    if (!confirm(`Send verification request to this kennel for ${pet.name}?`)) return;

    setRequestLoading(true);
    try {
      // Use the exact same method as EditPet
      await api.requestPetLink(
        Number(selectedKennelId),
        Number(id),
        `Please verify that ${pet.name} was born/registered in your kennel.`
      );

      setHasPendingRequest(true);
      setSelectedKennelId("");
      alert("Verification request sent successfully!");
    } catch (err) {
      alert("Failed to send request: " + (err.message || "Unknown error"));
    } finally {
      setRequestLoading(false);
    }
  };

  const handleRemoveVerification = async () => {
    try {
      await api.removePetVerification(pet.id);
      setPet(prev => ({ ...prev, kennelId: null }));
      setKennel(null);
      alert("Kennel verification removed.");
    } catch (err) {
      alert("Failed: " + err.message);
    } finally {
      setModalOpen(false);
    }
  };

  if (loading) return <div className="loader">Loading…</div>;
  if (!pet) return <div>Pet not found</div>;

  const hasVerification = !!pet.kennelId;

  return (
    <article className="my-pet-profile">
      <header className="my-pet-profile__header">
        <Link to="/pets/my" className="back-link">← Back to My Pets</Link>
        <h1>{pet.name}</h1>
      </header>

      <div className="my-pet-profile__hero">
        <img src={pet.images?.[0]?.url || "/placeholder-dog.jpg"} alt={pet.name} />
      </div>

      <section className="my-pet-profile__details">
        <p><strong>Breed:</strong> {pet.breed}</p>
        <p><strong>Sex:</strong> {pet.sex}</p>
        <p><strong>Color:</strong> {pet.color}</p>
        <p><strong>Age:</strong> {pet.age ? `${pet.age} years` : "—"}</p>

        <div className="my-pet-profile__verification">
          <strong>Kennel Verification:</strong>

          {hasVerification ? (
            <div className="verified">
              <span className="badge badge--success">Officially Verified</span>
              <Link to={`/kennel/${kennel.id}`} className="kennel-link">
                {kennel.name} ({kennel.location})
              </Link>
              <button
                onClick={() => setModalOpen(true)}
                className="btn btn--danger-outline btn--small"
              >
                Remove Verification
              </button>
            </div>
          ) : hasPendingRequest ? (
            <p className="text-warning">
              Verification request is pending…
            </p>
          ) : (
            <div className="not-verified">
              <p style={{ margin: "0.5rem 0", fontSize: "0.95rem" }}>
                Was <strong>{pet.name}</strong> born in a registered kennel?
              </p>

              <select
                value={selectedKennelId}
                onChange={(e) => setSelectedKennelId(e.target.value)}
                className="edit-pet__input edit-pet__select"
                style={{ width: "100%", marginBottom: "0.75rem" }}
              >
                <option value="">Select kennel of origin…</option>
                {kennels.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.name} {k.location ? `(${k.location})` : ""}
                  </option>
                ))}
              </select>

              {selectedKennelId && (
                <button
                  onClick={handleRequestVerification}
                  disabled={requestLoading}
                  className="btn btn--primary btn--small"
                >
                  {requestLoading ? "Sending…" : "Request Official Verification"}
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      <div className="my-pet-profile__actions">
        <Link to={`/pets/${pet.id}/edit`} className="btn btn--outline">
          Edit Pet Details
        </Link>
        <Link to={`/pets/${pet.id}`} className="btn btn--outline-underline">
          View Public Profile →
        </Link>
      </div>

      <ConfirmModal
        isOpen={modalOpen}
        title="Remove Kennel Verification"
        message={
          <>
            <p>Remove official kennel verification from <strong>{pet.name}</strong>?</p>
            <p>This usually means:</p>
            <ul>
              <li>The dog was sold</li>
              <li>There was a registration mistake</li>
              <li>You no longer wish to be associated</li>
            </ul>
            <p><strong>This cannot be undone.</strong></p>
          </>
        }
        confirmText="Yes, Remove Verification"
        danger={true}
        onConfirm={handleRemoveVerification}
        onCancel={() => setModalOpen(false)}
      />
      {pet && (
        <CertificationRequest petId={pet.id} petName={pet.name} />
      )}
    </article>
  );
}