import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { initStorage } from "./models/User.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173"
}));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ message: "RBAC backend is running (no MongoDB required)" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// Initialize file/in-memory data storage and start server
initStorage().then(() => {
  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });
}).catch((error) => {
  console.error("Initialization failed:", error.message);
  process.exit(1);
});