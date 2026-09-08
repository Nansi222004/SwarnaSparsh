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
const Order = require("../src/models/Order");
const Return = require("../src/models/Return");
const Replacement = require("../src/models/Replacement");

const FIXTURE_USER_EMAIL = "hardening.verification@sands.com";
const FIXTURE_RETURN_ID = "RET-HARDEN-01";
const FIXTURE_REPLACEMENT_ID = "REP-HARDEN-01";
const FIXTURE_SHIPMENT_ORDER_ID = "ORD-HARDEN-SHIP-01";
const FIXTURE_RETURN_ORDER_ID = "ORD-HARDEN-RETURN-01";
const FIXTURE_REPLACEMENT_ORDER_ID = "ORD-HARDEN-REPLACE-01";

const buildTimeline = (entries) =>
  entries.map((entry) => ({
    status: entry.status,
    note: entry.note,
    date: new Date(),
  }));

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

const signSellerToken = (seller) =>
  jwt.sign(
    { userId: seller._id, role: "seller" },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

const resetFixtures = async () => {
  await Order.updateOne(
    { orderId: FIXTURE_SHIPMENT_ORDER_ID },
    {
      $set: {
        status: "Processing",
        shippingInfo: {},
      },
      $unset: { notes: "" },
      $setOnInsert: {},
    }
  );
  await Order.updateOne(
    { orderId: FIXTURE_SHIPMENT_ORDER_ID },
    {
      $set: {
        timeline: buildTimeline([
          { status: "Ordered", note: "Hardening fixture shipment order created" },
          { status: "Processing", note: "Ready for seller shipment verification" },
        ]),
      },
    }
  );

  await Order.updateOne(
    { orderId: FIXTURE_RETURN_ORDER_ID },
    {
      $set: {
        status: "Return Requested",
        timeline: buildTimeline([
          { status: "Ordered", note: "Hardening fixture return order created" },
          { status: "Delivered", note: "Fixture delivered for return verification" },
          { status: "Return Requested", note: "Return fixture linked to this order" },
        ]),
      },
    }
  );

  await Return.updateOne(
    { returnId: FIXTURE_RETURN_ID },
    {
      $set: {
        status: "Pending",
        adminComment: "Hardening fixture return",
        pickup: {},
        refund: {},
        inventory: {},
        timeline: buildTimeline([
          { status: "Requested", note: "Hardening fixture return created" },
        ]),
        logs: [{
          action: "FIXTURE_RESET",
          comment: "Reset by transition test script",
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
        timeline: buildTimeline([
          { status: "Ordered", note: "Hardening fixture replacement order created" },
          { status: "Delivered", note: "Fixture delivered for replacement verification" },
          { status: "Return Requested", note: "Replacement fixture linked to this order" },
        ]),
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
        timeline: buildTimeline([
          { status: "Requested", note: "Hardening fixture replacement created" },
        ]),
      },
    }
  );
};

const expectHttp = async (promise, statusCode, label) => {
  try {
    const response = await promise;
    assert.strictEqual(response.status, statusCode, `${label}: expected HTTP ${statusCode}`);
    return response;
  } catch (error) {
    if (error.response) {
      assert.strictEqual(error.response.status, statusCode, `${label}: expected HTTP ${statusCode}, got ${error.response.status}`);
      return error.response;
    }
    throw error;
  }
};

const main = async () => {
  runFixtureSetup();
  await mongoose.connect(process.env.MONGO_URI);

  const admin = await User.findOne({ role: "admin" }).lean();
  const seller = await Seller.findById("69be48b30acb4daba1c53c3f").lean();
  const fixtureUser = await User.findOne({ email: FIXTURE_USER_EMAIL }).lean();
  const shipmentOrder = await Order.findOne({ orderId: FIXTURE_SHIPMENT_ORDER_ID }).lean();
  const returnFixture = await Return.findOne({ returnId: FIXTURE_RETURN_ID }).lean();
  const replacementFixture = await Replacement.findOne({ replacementId: FIXTURE_REPLACEMENT_ID }).lean();

  assert(admin, "Missing admin user for transition tests");
  assert(seller, "Missing seller fixture account for transition tests");
  assert(fixtureUser, "Missing hardening fixture user for transition tests");
  assert(shipmentOrder, "Missing shipment fixture order for transition tests");
  assert(returnFixture, "Missing return fixture for transition tests");
  assert(replacementFixture, "Missing replacement fixture for transition tests");

  const server = await startServer();
  const port = server.address().port;
  const baseURL = `http://127.0.0.1:${port}/api`;

  const adminApi = axios.create({
    baseURL,
    headers: { Authorization: `Bearer ${signAdminToken(admin)}` },
  });
  const sellerApi = axios.create({
    baseURL,
    headers: { Authorization: `Bearer ${signSellerToken(seller)}` },
  });

  const checks = [];
  const mark = (label) => checks.push(label);

  try {
    await resetFixtures();

    let response = await expectHttp(
      sellerApi.patch(`/seller/orders/${shipmentOrder._id}/status`, { status: "Packed" }),
      400,
      "Seller invalid Processing -> Packed"
    );
    assert.match(response.data?.message || "", /cannot move order/i, "Seller invalid Processing -> Packed should explain transition failure");
    mark("Seller invalid Processing -> Packed");

    response = await expectHttp(
      sellerApi.patch(`/seller/orders/${shipmentOrder._id}/status`, { status: "Confirmed" }),
      200,
      "Seller valid Processing -> Confirmed"
    );
    assert.strictEqual(response.data?.data?.order?.status, "Confirmed", "Seller valid Processing -> Confirmed should persist");
    mark("Seller valid Processing -> Confirmed");

    response = await expectHttp(
      sellerApi.patch(`/seller/orders/${shipmentOrder._id}/status`, { status: "Packed" }),
      200,
      "Seller valid Confirmed -> Packed"
    );
    assert.strictEqual(response.data?.data?.order?.status, "Packed", "Seller valid Confirmed -> Packed should persist");
    mark("Seller valid Confirmed -> Packed");

    response = await expectHttp(
      sellerApi.patch(`/seller/orders/${shipmentOrder._id}/status`, { status: "Delivered" }),
      400,
      "Seller invalid Packed -> Delivered"
    );
    assert.match(response.data?.message || "", /cannot move order/i, "Seller invalid Packed -> Delivered should explain transition failure");
    mark("Seller invalid Packed -> Delivered");

    response = await expectHttp(
      sellerApi.patch(`/seller/orders/${shipmentOrder._id}/status`, { status: "Shipped" }),
      400,
      "Seller invalid Packed -> Shipped without carrier"
    );
    assert.match(response.data?.message || "", /carrier is required/i, "Seller invalid Packed -> Shipped without carrier should require carrier");
    mark("Seller invalid Packed -> Shipped without carrier");

    response = await expectHttp(
      sellerApi.patch(`/seller/orders/${shipmentOrder._id}/status`, {
        status: "Shipped",
        shippingInfo: {
          carrier: "Manual Hardening Courier",
          trackingId: "HARDEN-TRACK-001",
          trackingUrl: "https://example.com/harden-track-001",
          estimatedDelivery: "2026-04-10",
        },
      }),
      200,
      "Seller valid Packed -> Shipped with carrier"
    );
    assert.strictEqual(response.data?.data?.order?.status, "Shipped", "Seller valid Packed -> Shipped with carrier should persist");
    assert.strictEqual(response.data?.data?.order?.shippingInfo?.carrier, "Manual Hardening Courier", "Seller shipped order should persist carrier");
    mark("Seller valid Packed -> Shipped with carrier");

    response = await expectHttp(
      adminApi.patch(`/admin/returns/${returnFixture._id}/status`, { status: "Refunded", refundAmount: 499 }),
      400,
      "Admin invalid Pending -> Refunded"
    );
    assert.match(response.data?.message || "", /invalid status transition/i, "Admin invalid Pending -> Refunded should explain transition failure");
    mark("Admin invalid Pending -> Refunded");

    response = await expectHttp(
      adminApi.patch(`/admin/returns/${returnFixture._id}/status`, { status: "Approved", note: "Approved in transition test" }),
      200,
      "Admin valid Pending -> Approved"
    );
    assert.strictEqual(response.data?.data?.returnReq?.status, "Approved", "Admin valid Pending -> Approved should persist");
    mark("Admin valid Pending -> Approved");

    response = await expectHttp(
      adminApi.patch(`/admin/returns/${returnFixture._id}/status`, {
        status: "Pickup Scheduled",
        pickupPartner: "Manual Pickup Partner",
        pickupAwb: "RET-AWB-001",
        pickupScheduledDate: "2026-04-11",
      }),
      200,
      "Admin valid Approved -> Pickup Scheduled"
    );
    assert.strictEqual(response.data?.data?.returnReq?.status, "Pickup Scheduled", "Admin valid Approved -> Pickup Scheduled should persist");
    mark("Admin valid Approved -> Pickup Scheduled");

    response = await expectHttp(
      adminApi.patch(`/admin/returns/${returnFixture._id}/status`, { status: "Refunded", refundAmount: 499 }),
      400,
      "Admin invalid Pickup Scheduled -> Refunded"
    );
    assert.match(response.data?.message || "", /invalid status transition/i, "Admin invalid Pickup Scheduled -> Refunded should explain transition failure");
    mark("Admin invalid Pickup Scheduled -> Refunded");

    response = await expectHttp(
      adminApi.patch(`/admin/replacements/${replacementFixture._id}/status`, { status: "Replacement Shipped" }),
      400,
      "Admin invalid Pending -> Replacement Shipped"
    );
    assert.match(response.data?.message || "", /invalid status transition/i, "Admin invalid Pending -> Replacement Shipped should explain transition failure");
    mark("Admin invalid Pending -> Replacement Shipped");

    response = await expectHttp(
      adminApi.patch(`/admin/replacements/${replacementFixture._id}/status`, { status: "Approved", note: "Approved in transition test" }),
      200,
      "Admin valid Pending -> Approved"
    );
    assert.strictEqual(response.data?.data?.repl?.status, "Approved", "Admin valid Pending -> Approved should persist");
    mark("Admin valid Pending -> Approved");

    response = await expectHttp(
      adminApi.patch(`/admin/replacements/${replacementFixture._id}/status`, { status: "Replacement Shipped" }),
      400,
      "Admin invalid Approved -> Replacement Shipped before pickup"
    );
    assert.match(response.data?.message || "", /after-pickup replacements/i, "Admin invalid Approved -> Replacement Shipped before pickup should explain pickup rule");
    mark("Admin invalid Approved -> Replacement Shipped before pickup");

    response = await expectHttp(
      adminApi.patch(`/admin/replacements/${replacementFixture._id}/status`, {
        status: "Pickup Scheduled",
        pickupPartner: "Manual Pickup Partner",
        pickupAwb: "REP-AWB-001",
        pickupScheduledDate: "2026-04-12",
      }),
      200,
      "Admin valid Approved -> Pickup Scheduled"
    );
    assert.strictEqual(response.data?.data?.repl?.status, "Pickup Scheduled", "Admin valid Approved -> Pickup Scheduled should persist");
    mark("Admin valid Approved -> Pickup Scheduled");

    response = await expectHttp(
      adminApi.patch(`/admin/replacements/${replacementFixture._id}/status`, {
        status: "Pickup Completed",
        itemCondition: "Good",
        stockAction: "Restock",
        pickupPartner: "Manual Pickup Partner",
      }),
      200,
      "Admin valid Pickup Scheduled -> Pickup Completed"
    );
    assert.strictEqual(response.data?.data?.repl?.status, "Pickup Completed", "Admin valid Pickup Scheduled -> Pickup Completed should persist");
    mark("Admin valid Pickup Scheduled -> Pickup Completed");

    response = await expectHttp(
      adminApi.patch(`/admin/replacements/${replacementFixture._id}/status`, {
        status: "Replacement Shipped",
        shipmentPartner: "Replacement Courier",
        shipmentAwb: "SHIP-AWB-001",
        shipmentTrackingLink: "https://example.com/ship-awb-001",
      }),
      200,
      "Admin valid Pickup Completed -> Replacement Shipped"
    );
    assert.strictEqual(response.data?.data?.repl?.status, "Replacement Shipped", "Admin valid Pickup Completed -> Replacement Shipped should persist");
    assert.strictEqual(response.data?.data?.repl?.shipment?.partner, "Replacement Courier", "Admin replacement shipment should persist carrier");
    mark("Admin valid Pickup Completed -> Replacement Shipped");

    console.log(`Ops transition tests passed (${checks.length} checks).`);
  } finally {
    await resetFixtures();
    await stopServer(server);
    await mongoose.disconnect();
  }
};

main().catch((err) => {
  console.error("Ops transition tests failed.");
  console.error(err.stack || err.message || err);
  process.exit(1);
});
