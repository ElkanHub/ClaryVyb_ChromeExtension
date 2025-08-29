const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const errorHandler = require("./middleware/errorHandler");
const connectDB = require("./config/db");

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
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/user", require("./routes/userRoutes"));
app.use("/api/prompt", require("./routes/promptRoutes"));

// 404
app.use((req, res) => res.status(404).json({ error: "Not found" }));

// Error handler (last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`ClaryVyb API on :${PORT}`));