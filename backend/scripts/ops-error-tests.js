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
const FIXTURE_RETURN_ID = "RET-HARDEN-01";
const FIXTURE_REPLACEMENT_ID = "REP-HARDEN-01";
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

const resetErrorFixtures = async () => {
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
          comment: "Reset by error test script",
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
  const user = await User.findOne({ email: FIXTURE_USER_EMAIL }).lean();
  const shipmentOrder = await Order.findOne({ orderId: FIXTURE_SHIPMENT_ORDER_ID }).lean();
  const returnFixture = await Return.findOne({ returnId: FIXTURE_RETURN_ID }).lean();
  const replacementFixture = await Replacement.findOne({ replacementId: FIXTURE_REPLACEMENT_ID }).lean();

  assert(admin, "Missing admin user for error tests");
  assert(seller, "Missing seller fixture account for error tests");
  assert(user, "Missing hardening fixture user for error tests");
  assert(shipmentOrder, "Missing shipment fixture order for error tests");
  assert(returnFixture, "Missing return fixture for error tests");
  assert(replacementFixture, "Missing replacement fixture for error tests");

  const server = await startServer();
  const port = server.address().port;
  const baseURL = `http://127.0.0.1:${port}/api`;

  const publicApi = axios.create({ baseURL });
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
    await resetErrorFixtures();

    let response = await expectHttp(
      publicApi.get(`/admin/orders/${shipmentOrder._id}`),
      401,
      "Unauthenticated admin orders access"
    );
    assert.match(response.data?.message || "", /no token provided/i, "Unauthenticated admin orders access should explain missing token");
    mark("Unauthenticated admin orders access");

    response = await expectHttp(
      sellerApi.get(`/admin/orders/${shipmentOrder._id}`),
      403,
      "Seller forbidden from admin order detail"
    );
    assert.match(response.data?.message || "", /forbidden/i, "Seller forbidden from admin order detail should explain role restriction");
    mark("Seller forbidden from admin order detail");

    response = await expectHttp(
      userApi.get(`/seller/orders/${shipmentOrder._id}`),
      403,
      "User forbidden from seller order detail"
    );
    assert.match(response.data?.message || "", /forbidden/i, "User forbidden from seller order detail should explain role restriction");
    mark("User forbidden from seller order detail");

    response = await expectHttp(
      adminApi.get("/admin/orders/000000000000000000000000"),
      404,
      "Admin missing order detail"
    );
    assert.match(response.data?.message || "", /order not found/i, "Admin missing order detail should explain missing record");
    mark("Admin missing order detail");

    response = await expectHttp(
      sellerApi.get("/seller/returns/000000000000000000000000"),
      404,
      "Seller missing return detail"
    );
    assert.match(response.data?.message || "", /return request not found/i, "Seller missing return detail should explain missing record");
    mark("Seller missing return detail");

    response = await expectHttp(
      adminApi.patch(`/admin/orders/${shipmentOrder._id}/status`, {}),
      400,
      "Admin missing order status payload"
    );
    assert.match(response.data?.message || "", /status is required/i, "Admin missing order status payload should require status");
    mark("Admin missing order status payload");

    response = await expectHttp(
      adminApi.patch(`/admin/returns/${returnFixture._id}/status`, { status: "NotARealStatus" }),
      400,
      "Admin invalid return status value"
    );
    assert.match(response.data?.message || "", /invalid status/i, "Admin invalid return status value should explain allowed statuses");
    mark("Admin invalid return status value");

    response = await expectHttp(
      adminApi.patch(`/admin/replacements/${replacementFixture._id}/status`, { status: "NotARealStatus" }),
      400,
      "Admin invalid replacement status value"
    );
    assert.match(response.data?.message || "", /invalid status/i, "Admin invalid replacement status value should explain allowed statuses");
    mark("Admin invalid replacement status value");

    response = await expectHttp(
      sellerApi.patch(`/seller/orders/${shipmentOrder._id}/status`, {}),
      400,
      "Seller missing status payload"
    );
    assert.match(response.data?.message || "", /status is required/i, "Seller missing status payload should require status");
    mark("Seller missing status payload");

    response = await expectHttp(
      sellerApi.patch(`/seller/orders/${shipmentOrder._id}/status`, { status: "Shipped" }),
      400,
      "Seller shipped without prerequisite progression"
    );
    assert.match(response.data?.message || "", /cannot move order/i, "Seller shipped without prerequisite progression should explain invalid transition");
    mark("Seller shipped without prerequisite progression");

    response = await expectHttp(
      sellerApi.patch(`/seller/returns/${returnFixture._id}/process`, { status: "Refunded" }),
      400,
      "Seller invalid return processing status"
    );
    assert.match(response.data?.message || "", /invalid status/i, "Seller invalid return processing status should explain allowed statuses");
    mark("Seller invalid return processing status");

    response = await expectHttp(
      adminApi.patch(`/admin/replacements/${replacementFixture._id}/status`, {
        status: "Approved",
        note: "Prepare replacement fixture for validation check",
      }),
      200,
      "Admin prepares replacement fixture"
    );

    response = await expectHttp(
      adminApi.patch(`/admin/replacements/${replacementFixture._id}/status`, {
        status: "Pickup Scheduled",
        pickupPartner: "Fixture Pickup Partner",
        pickupAwb: "REP-ERR-001",
        pickupScheduledDate: "2026-04-22",
      }),
      200,
      "Admin schedules replacement fixture before validation check"
    );

    response = await expectHttp(
      adminApi.patch(`/admin/replacements/${replacementFixture._id}/status`, {
        status: "Pickup Completed",
      }),
      400,
      "Admin pickup completed without replacement details"
    );
    assert.match(response.data?.message || "", /item condition is required|stock action is required/i, "Admin pickup completed without replacement details should explain missing fields");
    mark("Admin pickup completed without replacement details");

    response = await expectHttp(
      adminApi.patch(`/admin/orders/${shipmentOrder._id}/status`, {
        status: "Confirmed",
        note: "Prepare order for carrier validation",
      }),
      200,
      "Admin prepares shipment fixture confirmation"
    );

    response = await expectHttp(
      adminApi.patch(`/admin/orders/${shipmentOrder._id}/status`, {
        status: "Packed",
        note: "Prepare order for carrier validation",
      }),
      200,
      "Admin prepares shipment fixture packing"
    );

    response = await expectHttp(
      adminApi.patch(`/admin/orders/${shipmentOrder._id}/status`, {
        status: "Shipped",
      }),
      400,
      "Admin shipped without carrier"
    );
    assert.match(response.data?.message || "", /carrier is required/i, "Admin shipped without carrier should require carrier");
    mark("Admin shipped without carrier");

    console.log(`Ops error-state tests passed (${checks.length} checks).`);
  } finally {
    await resetErrorFixtures();
    await stopServer(server);
    await mongoose.disconnect();
  }
};

main().catch((err) => {
  console.error("Ops error-state tests failed.");
  console.error(err.stack || err.message || err);
  process.exit(1);
});
