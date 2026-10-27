const express = require("express");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const roadmapRouter = require("./roadmapRoutes");
const aiRouter = require("./aiRoutes");
const usageRouter = require("./usageRoutes");
const exportRouter = require("./exportRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

app.set("trust proxy", 1);

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.some((o) => origin.startsWith(o) || o === "*")) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

// 50mb limit for base64 audio chunks
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use(roadmapRouter);

// Trust reverse proxy (Render / Vercel load balancers) so client IP is accurately detected
app.set("trust proxy", 1);

// General limiter for auth, usage, and export checks (100 reqs per 15m)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests from this IP. Please try again after 15 minutes." }
});

// Dedicated strict limiter for heavy AI multimodal audio transcription (25 chunks per 15m)
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "AI transcription rate limit reached. Please wait a few minutes before transcribing more chunks." }
});

app.use("/api/ai/", aiLimiter);
app.use("/api/", generalLimiter);

app.use(aiRouter);
app.use(usageRouter);
app.use(exportRouter);

app.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 CreateCaptions Server listening on port " + PORT);
});
