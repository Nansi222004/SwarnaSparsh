const dotenv = require("dotenv");
dotenv.config();

const http = require("http");
const app = require("./src/app");
const connectDB = require("./src/config/db");
const { initSocket } = require("./src/socket");
const { seed: seedCommissionTiers } = require("./src/seeders/commissionTiersSeeder");

const PORT = process.env.PORT || 5000;
const HOST = "0.0.0.0"; // Bind to all interfaces for network access

const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

connectDB().then(async () => {
  // Best-effort seed: never block boot on a seeder failure.
  try {
    const result = await seedCommissionTiers();
    if (!result.skipped) {
      console.log("✅  Commission tiers seeded with", result.tiers.length, "default rows");
    }
  } catch (err) {
    console.warn("⚠️  Commission tiers seeder skipped:", err.message);
  }

  server.listen(PORT, HOST, () => {
    console.log(`✅  Server running on http://${HOST}:${PORT}`);
  });
});
// restart
