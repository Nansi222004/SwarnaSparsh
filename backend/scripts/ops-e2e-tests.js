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
const FIXTURE_SHIPMENT_ORDER_ID = "ORD-HARDEN-SHIP-01";
const FIXTURE_RETURN_ORDER_ID = "ORD-HARDEN-RETURN-01";
const FIXTURE_REPLACEMENT_ORDER_ID = "ORD-HARDEN-REPLACE-01";
const FIXTURE_RETURN_ID = "RET-HARDEN-01";
const FIXTURE_REPLACEMENT_ID = "REP-HARDEN-01";

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

const signUserToken = (user) =>
  jwt.sign(
    { userId: user._id, role: "user", email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

const nowEntry = (status, note) => ({ status, note, date: new Date() });

const resetE2EFixtures = async () => {
  await Order.updateOne(
    { orderId: FIXTURE_SHIPMENT_ORDER_ID },
    {
      $set: {
        status: "Processing",
        paymentStatus: "cod",
        shippingInfo: {},
        timeline: [
          nowEntry("Ordered", "Hardening fixture shipment order created"),
          nowEntry("Processing", "Ready for seller shipment verification"),
        ],
      },
    }
  );

  await Order.updateOne(
    { orderId: FIXTURE_RETURN_ORDER_ID },
    {
      $set: {
        status: "Return Requested",
        paymentStatus: "cod",
        timeline: [
          nowEntry("Ordered", "Hardening fixture return order created"),
          nowEntry("Delivered", "Fixture delivered for return verification"),
          nowEntry("Return Requested", "Return fixture linked to this order"),
        ],
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
        timeline: [nowEntry("Requested", "Hardening fixture return created")],
        logs: [{
          action: "FIXTURE_RESET",
          comment: "Reset by e2e test script",
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
          nowEntry("Ordered", "Hardening fixture replacement order created"),
          nowEntry("Delivered", "Fixture delivered for replacement verification"),
          nowEntry("Return Requested", "Replacement fixture linked to this order"),
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
        timeline: [nowEntry("Requested", "Hardening fixture replacement created")],
      },
    }
  );
};

const main = async () => {
  runFixtureSetup();
  await mongoose.connect(process.env.MONGO_URI);

  const admin = await User.findOne({ role: "admin" }).lean();
  const seller = await Seller.findById("69be48b30acb4daba1c53c3f").lean();
  const user = await User.findOne({ email: FIXTURE_USER_EMAIL }).lean();
  const shipmentOrder = await Order.findOne({ orderId: FIXTURE_SHIPMENT_ORDER_ID }).lean();
  const returnFixture = await Return.findOne({ returnId: FIXTURE_RETURN_ID }).lean();
  const replacementFixture = await Replacement.findOne({ replacementId: FIXTURE_REPLACEMENT_ID }).lean();

  assert(admin, "Missing admin user for e2e tests");
  assert(seller, "Missing seller fixture account for e2e tests");
  assert(user, "Missing hardening fixture user for e2e tests");
  assert(shipmentOrder, "Missing shipment fixture order for e2e tests");
  assert(returnFixture, "Missing return fixture for e2e tests");
  assert(replacementFixture, "Missing replacement fixture for e2e tests");

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
  const userApi = axios.create({
    baseURL,
    headers: { Authorization: `Bearer ${signUserToken(user)}` },
  });

  const checks = [];
  const mark = (label) => checks.push(label);

  try {
    await resetE2EFixtures();

    // Order flow: user -> seller -> admin -> user
    let response = await userApi.get(`/user/orders/${shipmentOrder._id}`);
    assert.strictEqual(response.status, 200, "User should load shipment fixture order");
    assert.strictEqual(response.data?.data?.order?.status, "Processing", "Shipment fixture should start in Processing");
    mark("User sees shipment fixture");

    response = await sellerApi.patch(`/seller/orders/${shipmentOrder._id}/status`, { status: "Confirmed", note: "Seller confirmed fixture order" });
    assert.strictEqual(response.status, 200, "Seller should confirm shipment fixture");

    response = await sellerApi.patch(`/seller/orders/${shipmentOrder._id}/status`, { status: "Packed", note: "Seller packed fixture order" });
    assert.strictEqual(response.status, 200, "Seller should pack shipment fixture");

    response = await sellerApi.patch(`/seller/orders/${shipmentOrder._id}/status`, {
      status: "Shipped",
      note: "Seller shipped fixture order",
      shippingInfo: {
        carrier: "Fixture Courier",
        trackingId: "FIX-SHIP-001",
        trackingUrl: "https://example.com/fix-ship-001",
        estimatedDelivery: "2026-04-20",
      },
    });
    assert.strictEqual(response.status, 200, "Seller should ship shipment fixture");
    assert.strictEqual(response.data?.data?.order?.status, "Shipped", "Shipment fixture should be Shipped after seller action");
    mark("Seller shipment lifecycle");

    response = await adminApi.patch(`/admin/orders/${shipmentOrder._id}/status`, {
      status: "Out for Delivery",
      note: "Admin moved fixture to out for delivery",
      shippingInfo: {
        carrier: "Fixture Courier",
        trackingId: "FIX-SHIP-001",
        trackingUrl: "https://example.com/fix-ship-001",
        estimatedDelivery: "2026-04-20",
      },
    });
    assert.strictEqual(response.status, 200, "Admin should move shipment fixture to Out for Delivery");

    response = await adminApi.patch(`/admin/orders/${shipmentOrder._id}/status`, {
      status: "Delivered",
      note: "Admin delivered fixture order",
    });
    assert.strictEqual(response.status, 200, "Admin should deliver shipment fixture");

    response = await userApi.get(`/user/orders/${shipmentOrder._id}`);
    assert.strictEqual(response.data?.data?.order?.status, "Delivered", "User should see shipment fixture as Delivered");
    assert.strictEqual(response.data?.data?.order?.shippingInfo?.carrier, "Fixture Courier", "User should see persisted shipping info");
    mark("Admin closes shipment lifecycle and user sees delivered");

    // Return flow: user -> seller -> admin -> user
    response = await userApi.get("/user/returns");
    assert(response.data?.data?.returns?.some((entry) => entry.returnId === FIXTURE_RETURN_ID && entry.status === "Pending"), "User should see pending return fixture");

    response = await sellerApi.get(`/seller/returns/${returnFixture._id}`);
    assert.strictEqual(response.data?.data?.returnReq?.status, "Pending", "Seller should see pending return fixture");

    response = await sellerApi.patch(`/seller/returns/${returnFixture._id}/process`, {
      status: "Approved",
      remarks: "Seller approved fixture return",
    });
    assert.strictEqual(response.status, 200, "Seller should approve return fixture");

    response = await adminApi.get(`/admin/returns/${returnFixture._id}`);
    assert.strictEqual(response.data?.data?.returnReq?.status, "Approved", "Admin should see seller-approved return fixture");

    response = await adminApi.patch(`/admin/returns/${returnFixture._id}/status`, {
      status: "Pickup Scheduled",
      note: "Admin scheduled pickup for fixture return",
      pickupPartner: "Fixture Pickup Partner",
      pickupAwb: "RET-FIX-001",
      pickupScheduledDate: "2026-04-21",
    });
    assert.strictEqual(response.status, 200, "Admin should schedule pickup for return fixture");

    response = await userApi.get("/user/returns");
    const updatedReturn = response.data?.data?.returns?.find((entry) => entry.returnId === FIXTURE_RETURN_ID);
    assert(updatedReturn && updatedReturn.status === "Pickup Scheduled", "User should see return fixture moved to Pickup Scheduled");
    mark("Return visibility and handoff flow");

    // Replacement flow: user -> admin -> user
    response = await userApi.get("/user/replacements");
    const pendingReplacement = response.data?.data?.replacements?.find((entry) => entry.replacementId === FIXTURE_REPLACEMENT_ID);
    assert(pendingReplacement && pendingReplacement.status === "Pending", "User should see pending replacement fixture");

    response = await adminApi.patch(`/admin/replacements/${replacementFixture._id}/status`, {
      status: "Approved",
      note: "Admin approved replacement fixture",
    });
    assert.strictEqual(response.status, 200, "Admin should approve replacement fixture");

    response = await adminApi.patch(`/admin/replacements/${replacementFixture._id}/status`, {
      status: "Pickup Scheduled",
      note: "Admin scheduled replacement pickup",
      pickupPartner: "Fixture Pickup Partner",
      pickupAwb: "REP-FIX-001",
      pickupScheduledDate: "2026-04-22",
    });
    assert.strictEqual(response.status, 200, "Admin should schedule pickup for replacement fixture");

    response = await userApi.get("/user/replacements");
    const updatedReplacement = response.data?.data?.replacements?.find((entry) => entry.replacementId === FIXTURE_REPLACEMENT_ID);
    assert(updatedReplacement && updatedReplacement.status === "Pickup Scheduled", "User should see replacement fixture moved to Pickup Scheduled");
    mark("Replacement visibility and handoff flow");

    console.log(`Ops end-to-end tests passed (${checks.length} checks).`);
  } finally {
    await resetE2EFixtures();
    await stopServer(server);
    await mongoose.disconnect();
  }
};

main().catch((err) => {
  console.error("Ops end-to-end tests failed.");
  console.error(err.stack || err.message || err);
  process.exit(1);
});
