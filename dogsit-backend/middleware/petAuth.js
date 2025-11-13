const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Middleware: canManagePet
 * -------------------------------------------------
 * Allows:
 *   • The pet’s owner (ownerId = req.user.id)
 *   • A kennel member with role "owner", "manager" or "employee"
 * -------------------------------------------------
 * Usage in route:
 *   router.put("/:id", authenticateToken, canManagePet, handler);
 */
async function canManagePet(req, res, next) {
  const userId = req.user.id;
  const petId  = parseInt(req.params.id);  
  if (!petId) return res.status(400).json({ error: "Pet ID required" });

  try {
    const pet = await prisma.pet.findUnique({
      where: { id: petId },
      select: {
        ownerId: true,
        kennelId: true,
        kennel: {
          select: {
            members: {
              select: { userId: true, role: true },
            },
          },
        },
      },
    });

    if (!pet) return res.status(404).json({ error: "Pet not found" });

    // 1. Owner of the pet
    if (pet.ownerId && pet.ownerId === userId) return next();

    // 2. Kennel member with edit rights
    if (pet.kennelId) {
      const member = pet.kennel.members.find(m => m.userId === userId);
      if (member && ["owner", "manager", "employee"].includes(member.role)) {
        return next();
      }
    }

    // No permission
    return res.status(403).json({ error: "Unauthorized to manage this pet" });
  } catch (err) {
    console.error("canManagePet error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

module.exports = { canManagePet };