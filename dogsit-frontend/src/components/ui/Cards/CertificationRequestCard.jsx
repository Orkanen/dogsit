import api from "@/api";

export default function CertificationRequestCard({ cert, onRefresh }) {
  const pet = cert.pet;
  const course = cert.course;
  const club = cert.issuingClub;

  const handleApprove = async () => {
    if (!confirm(`Approve certificate for ${pet.name} in ${course.title}?`)) return;
    try {
      await api.certifications.verify(cert.id);
      alert("Certificate approved and issued!");
      onRefresh();
    } catch (err) {
      alert("Failed to approve: " + (err.message || "Unknown error"));
    }
  };

  const handleReject = async () => {
    const reason = prompt("Reason for rejection (optional):");
    try {
      await api.certifications.reject(cert.id, reason);
      alert("Certificate request rejected");
      onRefresh();
    } catch (err) {
      alert("Failed to reject: " + (err.message || "Unknown error"));
    }
  };

  return (
    <div className="request-card p-4 border rounded-lg bg-white shadow-sm">
      <div className="flex gap-4">
        <img
          src={pet.images?.[0]?.url || "/placeholder-dog.jpg"}
          alt={pet.name}
          className="w-16 h-16 rounded-full object-cover border"
        />
        <div className="flex-1">
          <h4 className="font-semibold">
            {pet.name} — {course.title}
          </h4>
          <p className="text-sm text-gray-600">Request for official certification</p>
          {cert.notes && <p className="text-sm italic text-gray-500 mt-1">"{cert.notes}"</p>}
        </div>
      </div>
      <div className="actions mt-4 flex gap-3">
        <button onClick={handleApprove} className="btn btn--success btn--small">
          Approve
        </button>
        <button onClick={handleReject} className="btn btn--danger-outline btn--small">
          Reject
        </button>
      </div>
    </div>
  );
}