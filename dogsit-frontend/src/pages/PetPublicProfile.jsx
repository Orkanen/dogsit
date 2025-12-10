import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/api";
//import "@/styles/pages/_petPublicProfile.scss";

export default function PetPublicProfile() {
  const { id } = useParams();
  const [pet, setPet] = useState(null);
  const [kennel, setKennel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.pet.getPetById(id);
        setPet(data);
        if (data.kennelId) {
          const k = await api.kennel.getKennelById(data.kennelId);
          setKennel(k);
        }
      } catch (err) {
        console.error("Failed to load pet:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <div>Loading…</div>;
  if (!pet) return <div>Pet not found</div>;

  return (
    <article className="pet-public-profile">
      <Link to="/explore" className="back">← Back</Link>

      <h1>{pet.name}</h1>
      <img src={pet.images?.[0]?.url || "/placeholder.jpg"} alt={pet.name} />

      <div className="info">
        <p><strong>Breed:</strong> {pet.breed}</p>
        <p><strong>Sex:</strong> {pet.sex}</p>
        <p><strong>Age:</strong> {pet.age ? `${pet.age} years` : "—"}</p>

        {kennel && (
          <p>
            <strong>Verified by:</strong>{" "}
            <Link to={`/kennel/${kennel.id}`}>{kennel.name}</Link>
            <span className="badge badge--verified">Official</span>
          </p>
        )}

        {pet.certifications?.length > 0 && (
          <div className="certifications">
            <h3>Certifications</h3>
            {pet.certifications
              .filter(c => c.status === "APPROVED")
              .map(c => (
                <div key={c.id} className="cert-badge">
                  {c.course.title} • {c.issuingClub?.name || c.issuingKennel?.name}
                </div>
              ))}
          </div>
        )}
      </div>
    </article>
  );
}