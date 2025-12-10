import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import api from "@/api";
import ConfirmModal from "@/components/ui/RevokeConfirmModal";
import CertificationRequest from "@/components/CertificationRequest";
import "@/styles/pages/_myPetProfile.scss";

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
    if (!user) return;

    try {
      setLoading(true);

      // 1. Load pet + all kennels in parallel
      const [petData, allKennels] = await Promise.all([
        api.pet.getPetById(id),
        api.kennel.getKennels(),
      ]);

      // Security: Only owner can access this private page
      if (petData.ownerId !== user.id) {
        window.location.replace(`/pets/${id}`);
        return;
      }

      setPet(petData);
      setKennels(allKennels);

      // 2. If pet already has kennel → load kennel name
      if (petData.kennelId) {
        try {
          const k = await api.kennel.getKennelById(petData.kennelId);
          setKennel(k);
        } catch {
          console.warn("Failed to load verified kennel");
        }
      }

      // 3. Check if there's a pending verification request for this pet
      try {
        const requests = await api.kennel.getRequests(); // unified endpoint
        const hasPending = requests.some(
          (r) =>
            r.type === "PET_LINK" &&
            r.pet?.id === Number(id) &&
            r.status === "PENDING"
        );
        setHasPendingRequest(hasPending);
      } catch (err) {
        console.warn("Could not check pending requests:", err);
        // Don't break the page if this fails
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

  if (loading) return <div className="loader">Loading…</div>;
  if (!pet) return <div>Pet not found</div>;

  const hasVerification = !!pet.kennelId;

  return (
    <article className="my-pet-profile">
      <header className="my-pet-profile__header">
        <Link to="/my-pets" className="back-link">
          ← Back to My Pets
        </Link>
        <h1>{pet.name}</h1>
      </header>

      <div className="my-pet-profile__hero">
        <img
          src={pet.images?.[0]?.url || "/placeholder-dog.jpg"}
          alt={pet.name}
        />
      </div>

      <section className="my-pet-profile__details">
        <p><strong>Breed:</strong> {pet.breed || "—"}</p>
        <p><strong>Sex:</strong> {pet.sex || "—"}</p>
        <p><strong>Color:</strong> {pet.color || "—"}</p>
        <p><strong>Age:</strong> {pet.age ? `${pet.age} years` : "—"}</p>

        {/* KENNEL VERIFICATION */}
        <div className="my-pet-profile__verification">
          <strong>Kennel Verification:</strong>

          {hasVerification ? (
            <div className="verified">
              <span className="badge badge--success">Verified</span>
              <Link to={`/kennel/${kennel.id}`} className="kennel-link">
                {kennel.name} {kennel.location && `(${kennel.location})`}
              </Link>
              <button
                onClick={() => setModalOpen(true)}
                className="btn btn--danger-outline btn--small"
              >
                Remove
              </button>
            </div>
          ) : hasPendingRequest ? (
            <p className="text-warning">
              Verification request pending…
            </p>
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

      <div className="my-pet-profile__actions">
        <Link to={`/my-pets/${pet.id}/edit`} className="btn btn--outline">
          Edit Pet
        </Link>
        <Link to={`/pets/${pet.id}`} className="btn btn--outline-underline">
          View Public Profile →
        </Link>
      </div>

      {/* CERTIFICATION REQUEST */}
      <CertificationRequest petId={pet.id} petName={pet.name} />

      {/* REMOVE VERIFICATION MODAL */}
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