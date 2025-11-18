import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/index";
import { useAuth } from "../context/AuthContext";

export default function PetProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPet = async () => {
      try {
        const data = await api.getPet(id);
        setPet(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPet();
  }, [id]);

  if (loading) return <div className="p-6 text-center">Loading pet...</div>;
  if (error) return <div className="p-6 text-red-600 text-center">{error}</div>;
  if (!pet) return <div className="p-6 text-center">Pet not found</div>;

  const canEdit = user && (pet.ownerId === user.id);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold">{pet.name}</h1>
          <p className="text-gray-600">
            {pet.species} • {pet.breed || "—"} • {pet.age ? `${pet.age} yrs` : "—"}
          </p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Link
              to={`/pets/${pet.id}/edit`}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Edit
            </Link>
            {/* delete button can be added later */}
          </div>
        )}
      </div>

      {/* Main image */}
      {pet.images?.[0] ? (
        <img
          src={pet.images[0].url}
          alt={pet.name}
          className="w-full h-80 object-cover rounded-lg shadow mb-6"
        />
      ) : (
        <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-80 flex items-center justify-center mb-6">
          No photo
        </div>
      )}

      {/* Info grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded">
        <Info label="Color" value={pet.color || "—"} />
        <Info label="Sex" value={pet.sex || "—"} />
        <Info label="Owner" value={pet.owner?.email || "—"} />
        <Info label="Kennel" value={pet.kennel?.name || "—"} />
      </div>

      {/* Back link */}
      <div className="mt-8">
        <Link to="/pets/my" className="text-blue-600 hover:underline">
          ← Back to My Pets
        </Link>
      </div>

      {canEdit && (
        <Link
          to={`/pets/${pet.id}/edit`}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Edit Pet
        </Link>
      )}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <strong className="text-gray-700">{label}:</strong>{" "}
      <span className="text-gray-900">{value}</span>
    </div>
  );
}