import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import errorHandler from "./middleware/errorHandler.js";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import promptRoutes from "./routes/promptRoutes.js";

dotenv.config();
const app = express();

// Connect DB
connectDB();

// Core middleware
app.use(express.json({ limit: "1mb" }));
app.use(helmet());
app.use(compression());
app.use(cors({ origin: "*", credentials: false })); // refine origin later
if (process.env.NODE_ENV !== "production") app.use(morgan("dev"));

// Health
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/prompt", promptRoutes);

// 404
app.use((req, res) => res.status(404).json({ error: "Not found" }));

// Error handler (last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`ClaryVyb API on :${PORT}`));