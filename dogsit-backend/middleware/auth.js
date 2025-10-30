const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Access token required" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid or expired token" });
    req.user = user;
    next();
  });
}

function andRestrictToSelf(req, res, next) {
    if (req.user.id == req.params.id) {
        next();
    } else {
        res.status(403).json({ error: "Unauthorized: can only access your own profile" });
    }
}

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (!allowedRoles.includes(req.user.role))
      return res.status(403).json({ error: "Forbidden: insufficient permissions" });
    next();
  };
}

module.exports = { authenticateToken, authorizeRoles, andRestrictToSelf };