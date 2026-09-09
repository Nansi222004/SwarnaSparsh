const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const morgan = require("morgan");

const { notFound, errorHandler } = require("./middlewares/errorHandler");
const authenticate = require("./middlewares/authenticate");
const requireRole = require("./middlewares/requireRole");

const app = express();

const defaultAllowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://sands-ornaments-ten.vercel.app",
  "https://sandsjewels.com",
];

const configuredAllowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
  : [];

const allowedOrigins = [
  ...new Set([...defaultAllowedOrigins, ...configuredAllowedOrigins]),
];

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes("*") || allowedOrigins.includes(origin))
    return true;

  try {
    const { hostname } = new URL(origin);
    return hostname.endsWith(".vercel.app");
  } catch (error) {
    return false;
  }
};

// ── GLOBAL MIDDLEWARES ───────────────────────────────────────────────────────
app.use(helmet()); // Security headers
const corsOptions = {
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize()); // Prevent NoSQL injection
app.use(compression()); // Performance: Gzip compression
app.use(morgan("dev")); // Logging (Production: use "combined")

// Trust first proxy (required for accurate IP detection behind reverse proxies/load balancers)
app.set("trust proxy", 1);

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000, // limit each IP to 1000 requests per windowMs
});
app.use("/api/", limiter);

// Health Check / Root route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Swarna Sparsh API is running smoothly",
    timestamp: new Date().toISOString(),
  });
});

// Auth (user + admin)
app.use("/api/auth", require("./modules/auth/routes/auth.routes"));

// Public Tracking (no auth)
app.use("/api/analytics", require("./modules/admin/routes/analytics.routes"));

// Public storefront (no auth)
app.use("/api/public", require("./modules/public/routes/index"));

// ── Courier Webhooks (no auth – verified by secret inside controllers) ───────
app.post(
  "/api/webhooks/shiprocket",
  require("./modules/shared/shiprocketWebhook.controller")
    .handleShiprocketWebhook,
);

// ── Direct Order Invoice Access (Customer ownership verified or Admin) ────────
app.get(
  "/api/orders/:id/invoice",
  authenticate,
  requireRole("user", "admin"),
  require("./modules/admin/controllers/invoice.controller").getOrderInvoice,
);

// Customer routes (must be authenticated)
app.use(
  "/api/user",
  authenticate,
  requireRole("user", "admin"),
  require("./modules/user/routes/index"),
);

// Admin routes
app.use(
  "/api/admin",
  authenticate,
  requireRole("admin"),
  require("./modules/admin/routes/index"),
);

// -- Error Handling -------------------------------------------------------------
app.use(notFound);
app.use(errorHandler);

module.exports = app;
