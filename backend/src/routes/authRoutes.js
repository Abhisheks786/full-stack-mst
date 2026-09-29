import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

function createToken(user) {
  return jwt.sign(
    {
      id: user._id.toString(),
      username: user.username,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }
  );
}

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "Username and password are required"
      });
    }

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = createToken(user);

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/seed", async (req, res) => {
  try {
    const users = [
      { username: "admin", password: "admin123", role: "admin" },
      { username: "viewer", password: "viewer123", role: "viewer" }
    ];

    for (const item of users) {
      const existing = await User.findOne({ username: item.username });

      if (!existing) {
        const hashed = await bcrypt.hash(item.password, 10);

        await User.create({
          username: item.username,
          password: hashed,
          role: item.role
        });
      }
    }

    res.json({
      message: "Demo users are ready",
      users: [
        { username: "admin", password: "admin123", role: "admin" },
        { username: "viewer", password: "viewer123", role: "viewer" }
      ]
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;