import { Link } from "react-router-dom";

export default function PetEnrollmentCard({ enrollment }) {
  const pet = enrollment.pet;
  const course = enrollment.course;
  const status = enrollment.status;

  const statusColor = {
    APPLIED: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
  }[status] || "bg-gray-100 text-gray-800";

  return (
    <article className="pet-enrollment-card bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex gap-4">
        {/* Pet Avatar */}
        <div className="flex-shrink-0">
          {pet?.images?.[0]?.url ? (
            <img
              src={pet.images[0].url}
              alt={pet.name}
              className="w-20 h-20 rounded-full object-cover border-2 border-gray-300"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-200 border-2 border-dashed border-gray-400 flex items-center justify-center text-2xl">
              🐕
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {pet?.name || "My Pet"} → {course?.title || "Unknown Course"}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Enrolled on {new Date(enrollment.appliedAt).toLocaleDateString()}
            {enrollment.processedAt && (
              <> • Processed {new Date(enrollment.processedAt).toLocaleDateString()}</>
            )}
          </p>

          <div className="flex items-center gap-3 mt-3">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
              {status}
            </span>

            {course?.club && (
              <Link
                to={`/club/${course.club.id}`}
                className="text-sm text-blue-600 hover:underline"
              >
                View Club
              </Link>
            )}
          </div>

          {status === "REJECTED" && enrollment.notes && (
            <p className="text-sm text-red-700 mt-2 italic">
              Note: {enrollment.notes}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}