require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const path = require("path");
const assert = require("assert");
const { execFileSync } = require("child_process");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const app = require("../src/app");
const User = require("../src/models/User");
const Seller = require("../src/models/Seller");
const Product = require("../src/models/Product");
const Order = require("../src/models/Order");
const Return = require("../src/models/Return");
const Replacement = require("../src/models/Replacement");
const StockLog = require("../src/models/StockLog");

const FIXTURE_RETURN_ID = "RET-HARDEN-01";
const FIXTURE_REPLACEMENT_ID = "REP-HARDEN-01";
const FIXTURE_PRODUCT_SLUG = "hardening-verification-seller-product";
const FIXTURE_RETURN_ORDER_ID = "ORD-HARDEN-RETURN-01";
const FIXTURE_REPLACEMENT_ORDER_ID = "ORD-HARDEN-REPLACE-01";

const runFixtureSetup = () => {
  execFileSync(process.execPath, [path.join(__dirname, "create-hardening-fixtures.js")], {
    cwd: path.join(__dirname, ".."),
    stdio: "inherit",
  });
};

const startServer = () =>
  new Promise((resolve) => {
    const server = app.listen(0, () => resolve(server));
  });

const stopServer = (server) =>
  new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });

const signAdminToken = (admin) =>
  jwt.sign(
    { userId: admin._id, role: "admin", email: admin.email },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

const getProductSnapshot = async () => {
  const product = await Product.findOne({ slug: FIXTURE_PRODUCT_SLUG }).lean();
  assert(product && product.variants?.[0], "Missing fixture product variant");
  return {
    productId: product._id,
    variantId: product.variants[0]._id,
    stock: Number(product.variants[0].stock) || 0,
    sold: Number(product.variants[0].sold) || 0,
  };
};

const countRelevantLogs = async (productId, variantId, regex) =>
  StockLog.countDocuments({
    productId,
    variantId,
    reason: { $regex: regex, $options: "i" },
  });

const resetIntegrityFixtures = async () => {
  const product = await Product.findOne({ slug: FIXTURE_PRODUCT_SLUG });
  assert(product && product.variants?.[0], "Missing fixture product during integrity reset");
  product.variants[0].stock = 17;
  product.variants[0].sold = 3;
  await product.save();

  await StockLog.deleteMany({
    productId: product._id,
    variantId: product.variants[0]._id,
    reason: {
      $in: [
        `Return Refunded for order ${FIXTURE_RETURN_ORDER_ID}`,
        `Replacement pickup completed for ${FIXTURE_REPLACEMENT_ID}`,
      ],
    },
  });

  await Order.updateOne(
    { orderId: FIXTURE_RETURN_ORDER_ID },
    {
      $set: {
        status: "Return Requested",
        paymentStatus: "cod",
        timeline: [
          { status: "Ordered", note: "Hardening fixture return order created", date: new Date() },
          { status: "Delivered", note: "Fixture delivered for return verification", date: new Date() },
          { status: "Return Requested", note: "Return fixture linked to this order", date: new Date() },
        ],
      },
    }
  );

  await Return.updateOne(
    { returnId: FIXTURE_RETURN_ID },
    {
      $set: {
        status: "Pending",
        pickup: {},
        refund: {},
        inventory: {},
        adminComment: "Hardening fixture return",
        timeline: [
          { status: "Requested", note: "Hardening fixture return created", date: new Date() },
        ],
        logs: [{
          action: "FIXTURE_RESET",
          comment: "Reset by integrity test script",
          by: "system",
          date: new Date(),
        }],
      },
    }
  );

  await Order.updateOne(
    { orderId: FIXTURE_REPLACEMENT_ORDER_ID },
    {
      $set: {
        status: "Return Requested",
        paymentStatus: "cod",
        timeline: [
          { status: "Ordered", note: "Hardening fixture replacement order created", date: new Date() },
          { status: "Delivered", note: "Fixture delivered for replacement verification", date: new Date() },
          { status: "Return Requested", note: "Replacement fixture linked to this order", date: new Date() },
        ],
      },
    }
  );

  await Replacement.updateOne(
    { replacementId: FIXTURE_REPLACEMENT_ID },
    {
      $set: {
        status: "Pending",
        replacementMode: "after_pickup",
        itemCondition: null,
        stockAction: null,
        pickup: {},
        shipment: {},
        inventory: {},
        adminComment: "Hardening fixture replacement",
        timeline: [
          { status: "Requested", note: "Hardening fixture replacement created", date: new Date() },
        ],
      },
    }
  );
};

const main = async () => {
  runFixtureSetup();
  await mongoose.connect(process.env.MONGO_URI);

  const admin = await User.findOne({ role: "admin" }).lean();
  const seller = await Seller.findById("69be48b30acb4daba1c53c3f").lean();
  const returnFixture = await Return.findOne({ returnId: FIXTURE_RETURN_ID }).lean();
  const replacementFixture = await Replacement.findOne({ replacementId: FIXTURE_REPLACEMENT_ID }).lean();

  assert(admin, "Missing admin user for integrity tests");
  assert(seller, "Missing seller fixture account for integrity tests");
  assert(returnFixture, "Missing return fixture for integrity tests");
  assert(replacementFixture, "Missing replacement fixture for integrity tests");

  const server = await startServer();
  const port = server.address().port;
  const adminApi = axios.create({
    baseURL: `http://127.0.0.1:${port}/api`,
    headers: { Authorization: `Bearer ${signAdminToken(admin)}` },
  });

  const checks = [];
  const mark = (label) => checks.push(label);

  try {
    await resetIntegrityFixtures();

    // Return refund integrity
    let before = await getProductSnapshot();
    const beforeReturnLogCount = await countRelevantLogs(before.productId, before.variantId, FIXTURE_RETURN_ORDER_ID);

    let response = await adminApi.patch(`/admin/returns/${returnFixture._id}/status`, { status: "Approved", note: "Integrity approved" });
    assert.strictEqual(response.status, 200, "Return Pending -> Approved should succeed");
    response = await adminApi.patch(`/admin/returns/${returnFixture._id}/status`, {
      status: "Pickup Scheduled",
      pickupPartner: "Integrity Pickup Partner",
      pickupAwb: "RET-INTEGRITY-001",
      pickupScheduledDate: "2026-04-15",
    });
    assert.strictEqual(response.status, 200, "Return Approved -> Pickup Scheduled should succeed");
    response = await adminApi.patch(`/admin/returns/${returnFixture._id}/status`, {
      status: "Pickup Completed",
      pickupPartner: "Integrity Pickup Partner",
      pickupAwb: "RET-INTEGRITY-001",
    });
    assert.strictEqual(response.status, 200, "Return Pickup Scheduled -> Pickup Completed should succeed");
    response = await adminApi.patch(`/admin/returns/${returnFixture._id}/status`, {
      status: "Refund Initiated",
      refundAmount: 499,
      refundMethod: "manual",
      refundTransactionId: "REF-INTEGRITY-001",
    });
    assert.strictEqual(response.status, 200, "Return Pickup Completed -> Refund Initiated should succeed");
    response = await adminApi.patch(`/admin/returns/${returnFixture._id}/status`, {
      status: "Refunded",
      refundAmount: 499,
      refundMethod: "manual",
      refundTransactionId: "REF-INTEGRITY-001",
    });
    assert.strictEqual(response.status, 200, "Return Refund Initiated -> Refunded should succeed");

    let after = await getProductSnapshot();
    assert.strictEqual(after.stock, before.stock + 1, "Refunded return should restock one unit");
    assert.strictEqual(after.sold, Math.max(0, before.sold - 1), "Refunded return should reduce sold count by one");

    let refreshedReturn = await Return.findOne({ returnId: FIXTURE_RETURN_ID }).lean();
    assert(refreshedReturn.inventory?.restockedAt, "Refunded return should persist inventory.restockedAt");
    assert.strictEqual(refreshedReturn.refund?.amount, 499, "Refunded return should persist refund amount");

    let refreshedReturnOrder = await Order.findOne({ orderId: FIXTURE_RETURN_ORDER_ID }).lean();
    assert.strictEqual(refreshedReturnOrder.status, "Returned", "Refunded return should set order status to Returned");
    assert.strictEqual(refreshedReturnOrder.paymentStatus, "refunded", "Refunded return should set payment status to refunded");

    let afterReturnLogCount = await countRelevantLogs(before.productId, before.variantId, FIXTURE_RETURN_ORDER_ID);
    assert.strictEqual(afterReturnLogCount, beforeReturnLogCount + 1, "Refunded return should create exactly one stock log");
    mark("Return refund integrity");

    response = await adminApi.patch(`/admin/returns/${returnFixture._id}/status`, {
      status: "Refunded",
      refundAmount: 499,
      refundMethod: "manual",
      refundTransactionId: "REF-INTEGRITY-001",
    });
    assert.strictEqual(response.status, 200, "Repeated Refunded status update should succeed without double restock");

    after = await getProductSnapshot();
    assert.strictEqual(after.stock, before.stock + 1, "Repeated Refunded update should not restock again");
    assert.strictEqual(after.sold, Math.max(0, before.sold - 1), "Repeated Refunded update should not reduce sold again");

    const afterSecondReturnLogCount = await countRelevantLogs(before.productId, before.variantId, FIXTURE_RETURN_ORDER_ID);
    assert.strictEqual(afterSecondReturnLogCount, afterReturnLogCount, "Repeated Refunded update should not create another stock log");
    mark("Return double-restock guard");

    // Replacement inventory integrity
    await resetIntegrityFixtures();
    before = await getProductSnapshot();
    const beforeReplacementLogCount = await countRelevantLogs(before.productId, before.variantId, FIXTURE_REPLACEMENT_ID);

    response = await adminApi.patch(`/admin/replacements/${replacementFixture._id}/status`, { status: "Approved", note: "Integrity approved" });
    assert.strictEqual(response.status, 200, "Replacement Pending -> Approved should succeed");
    response = await adminApi.patch(`/admin/replacements/${replacementFixture._id}/status`, {
      status: "Pickup Scheduled",
      pickupPartner: "Integrity Pickup Partner",
      pickupAwb: "REP-INTEGRITY-001",
      pickupScheduledDate: "2026-04-16",
    });
    assert.strictEqual(response.status, 200, "Replacement Approved -> Pickup Scheduled should succeed");
    response = await adminApi.patch(`/admin/replacements/${replacementFixture._id}/status`, {
      status: "Pickup Completed",
      itemCondition: "Good",
      stockAction: "Restock",
      pickupPartner: "Integrity Pickup Partner",
      pickupAwb: "REP-INTEGRITY-001",
    });
    assert.strictEqual(response.status, 200, "Replacement Pickup Scheduled -> Pickup Completed should succeed");

    after = await getProductSnapshot();
    assert.strictEqual(after.stock, before.stock + 1, "Replacement pickup completion with Restock should restock one unit");
    assert.strictEqual(after.sold, Math.max(0, before.sold - 1), "Replacement pickup completion with Restock should reduce sold by one");

    let refreshedReplacement = await Replacement.findOne({ replacementId: FIXTURE_REPLACEMENT_ID }).lean();
    assert(refreshedReplacement.inventory?.processedAt, "Replacement pickup completion should persist inventory.processedAt");
    assert.strictEqual(refreshedReplacement.inventory?.actionApplied, "Restock", "Replacement pickup completion should persist actionApplied");

    let refreshedReplacementOrder = await Order.findOne({ orderId: FIXTURE_REPLACEMENT_ORDER_ID }).lean();
    assert.strictEqual(refreshedReplacementOrder.status, "Return Requested", "Replacement active flow should keep order in Return Requested");

    let afterReplacementLogCount = await countRelevantLogs(before.productId, before.variantId, FIXTURE_REPLACEMENT_ID);
    assert.strictEqual(afterReplacementLogCount, beforeReplacementLogCount + 1, "Replacement restock should create exactly one stock log");
    mark("Replacement restock integrity");

    response = await adminApi.patch(`/admin/replacements/${replacementFixture._id}/status`, {
      status: "Pickup Completed",
      itemCondition: "Good",
      stockAction: "Restock",
      pickupPartner: "Integrity Pickup Partner",
      pickupAwb: "REP-INTEGRITY-001",
    });
    assert.strictEqual(response.status, 200, "Repeated Pickup Completed update should succeed without double restock");

    after = await getProductSnapshot();
    assert.strictEqual(after.stock, before.stock + 1, "Repeated Pickup Completed update should not restock again");
    assert.strictEqual(after.sold, Math.max(0, before.sold - 1), "Repeated Pickup Completed update should not reduce sold again");

    const afterSecondReplacementLogCount = await countRelevantLogs(before.productId, before.variantId, FIXTURE_REPLACEMENT_ID);
    assert.strictEqual(afterSecondReplacementLogCount, afterReplacementLogCount, "Repeated Pickup Completed update should not create another stock log");
    mark("Replacement double-restock guard");

    console.log(`Ops integrity tests passed (${checks.length} checks).`);
  } finally {
    await resetIntegrityFixtures();
    await stopServer(server);
    await mongoose.disconnect();
  }
};

main().catch((err) => {
  console.error("Ops integrity tests failed.");
  console.error(err.stack || err.message || err);
  process.exit(1);
});
