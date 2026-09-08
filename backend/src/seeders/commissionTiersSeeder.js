/**
 * Seed the default platform commission tiers into the Setting singleton.
 *
 * Run standalone:  node src/seeders/commissionTiersSeeder.js
 * Run from server boot: require("./seeders/commissionTiersSeeder").seed();
 *
 * Idempotent: leaves existing tiers untouched if they are already configured.
 * Pass `--force` to overwrite an existing configuration with the defaults.
 */
"use strict";

require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Setting = require("../models/Setting");
const { DEFAULT_COMMISSION_TIERS } = require("../constants/commissionTiers");

const seed = async ({ force = false } = {}) => {
  const setting = (await Setting.findOne()) || new Setting({});

  const hasTiers = Array.isArray(setting.commissionTiers) && setting.commissionTiers.length > 0;

  if (hasTiers && !force) {
    return { skipped: true, reason: "Tiers already configured", tiers: setting.commissionTiers };
  }

  setting.commissionTiers     = DEFAULT_COMMISSION_TIERS.map((t) => ({ ...t }));
  setting.commissionEnabled   = setting.commissionEnabled !== false; // preserve explicit false
  setting.commissionUpdatedAt = new Date();
  await setting.save();

  return { skipped: false, tiers: setting.commissionTiers };
};

// CLI entrypoint
if (require.main === module) {
  const force = process.argv.includes("--force");
  (async () => {
    try {
      await connectDB();
      const result = await seed({ force });
      if (result.skipped) {
        console.log("ℹ️  Commission tiers seeder skipped:", result.reason);
      } else {
        console.log("✅  Commission tiers seeded:", result.tiers.length, "rows");
      }
      process.exit(0);
    } catch (err) {
      console.error("❌  Commission tiers seeder failed:", err);
      process.exit(1);
    }
  })();
}

module.exports = { seed };
