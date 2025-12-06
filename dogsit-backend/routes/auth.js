const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const rawEmail = req.body.email;
    const { password } = req.body;
    let { roleNames = [] } = req.body;

    if (!rawEmail || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const email = String(rawEmail).trim().toLowerCase();
    roleNames = Array.isArray(roleNames) && roleNames.length
      ? roleNames.map(r => String(r).trim().toLowerCase())
      : ["sitter"];

    // Upsert roles
    for (const roleName of roleNames) {
      if (!roleName) continue;
      await prisma.role.upsert({
        where: { name: roleName },
        update: {},
        create: { name: roleName },
      });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(409).json({ error: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        roles: {
          create: roleNames.map(name => ({
            role: { connect: { name } }
          }))
        },
        profile: { create: {} }
      },
      include: {
        roles: { include: { role: true } },
        profile: true
      }
    });

    const roles = user.roles.map(r => r.role.name);
    const token = jwt.sign(
      { id: user.id, email: user.email, roles },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "Registered successfully",
      token,
      user: {
        id: user.id,
        email: user.email,
        roles,
        profile: user.profile
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    if (error?.code === "P2002") {
      return res.status(409).json({ error: "Email already in use" });
    }
    res.status(500).json({ error: "Registration failed" });
  }
});

// LOGIN — CLEAN & SECURE
router.post("/login", async (req, res) => {
  try {
    const { email: rawEmail, password } = req.body;

    if (!rawEmail || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const email = String(rawEmail).trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        roles: { include: { role: true } },
        profile: true,
      },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const roles = user.roles.map(r => r.role.name);
    const token = jwt.sign(
      { id: user.id, email: user.email, roles },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        roles,
        profile: user.profile,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

module.exports = router;