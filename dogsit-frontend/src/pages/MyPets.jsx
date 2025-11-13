// src/pages/MyPets.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/auth";
import api from "../lib/api";

export default function MyPets() {
  const { user, loading: authLoading } = useAuth();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;

    const fetchPets = async () => {
      try {
        const data = await api.getMyPets();
        setPets(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPets();
  }, [user]);

  if (authLoading) return <div className="p-6">Loading…</div>;
  if (!user) return <div className="p-6">Please log in.</div>;
  if (loading) return <div className="p-6">Loading your pets…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Pets</h1>
        <Link
          to="/pets/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Add Pet
        </Link>
      </div>

      {pets.length === 0 ? (
        <p className="text-gray-600">You don't have any pets yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pets.map((pet) => (
            <Link
              key={pet.id}
              to={`/pets/${pet.id}`}
              className="border rounded-lg overflow-hidden shadow hover:shadow-lg transition"
            >
              {pet.images?.[0] ? (
                <img
                  src={pet.images[0].url}
                  alt={pet.name}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="bg-gray-200 h-48 flex items-center justify-center">
                  <span className="text-gray-500">No photo</span>
                </div>
              )}
              <div className="p-4">
                <h3 className="font-semibold text-lg">{pet.name}</h3>
                <p className="text-sm text-gray-600">
                  {pet.species} • {pet.breed || "—"}
                </p>
                {pet.kennel && (
                  <p className="text-xs text-blue-600 mt-1">
                    Kennel: {pet.kennel.name}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}