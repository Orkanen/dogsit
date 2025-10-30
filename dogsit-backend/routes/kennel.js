const express = require('express');
const { authenticateToken, authorizeRoles } = require("../middleware/auth");
const router = express.Router();

router.get(
  "/dashboard",
  authenticateToken,
  authorizeRoles("kennel"),
  (req, res) => {
    res.json({ message: `Welcome to the kennel dashboard, ${req.user.email}!` });
  }
);

module.exports = router;