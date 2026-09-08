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

const runFixtureSetup = () => {
  execFileSync(process.execPath, [path.join(__dirname, "create-hardening-fixtures.js")], {
    cwd: path.join(__dirname, ".."),
    stdio: "inherit",
  });
};

const expectSuccess = (response, label) => {
  assert.strictEqual(response.status, 200, `${label}: expected HTTP 200`);
  assert.strictEqual(response.data?.success, true, `${label}: expected success=true`);
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

  assert(admin, "Missing admin user for smoke tests");
  assert(seller, "Missing seller fixture account for smoke tests");
  assert(fixtureUser, "Missing hardening fixture user");
  assert(shipmentOrder, "Missing shipment fixture order");
  assert(returnFixture, "Missing return fixture record");
  assert(replacementFixture, "Missing replacement fixture record");

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
    headers: { Authorization: `Bearer ${signUserToken(fixtureUser)}` },
  });

  const results = [];

  const runCheck = async (label, fn) => {
    const response = await fn();
    results.push(label);
    return response;
  };

  try {
    const publicProducts = await runCheck("Public products", () => publicApi.get("/public/products?limit=3"));
    expectSuccess(publicProducts, "Public products");
    assert(Array.isArray(publicProducts.data?.data?.products), "Public products: products should be an array");

    const adminOrders = await runCheck("Admin orders list", () => adminApi.get("/admin/orders"));
    expectSuccess(adminOrders, "Admin orders list");
    assert(Array.isArray(adminOrders.data?.data?.orders), "Admin orders list: orders should be an array");

    const adminOrderDetail = await runCheck("Admin order detail", () => adminApi.get(`/admin/orders/${shipmentOrder._id}`));
    expectSuccess(adminOrderDetail, "Admin order detail");
    assert.strictEqual(adminOrderDetail.data?.data?.order?.orderId, FIXTURE_SHIPMENT_ORDER_ID, "Admin order detail: wrong order returned");

    const adminReturns = await runCheck("Admin returns list", () => adminApi.get("/admin/returns"));
    expectSuccess(adminReturns, "Admin returns list");
    assert(Array.isArray(adminReturns.data?.data?.returns), "Admin returns list: returns should be an array");
    assert(adminReturns.data.data.returns.some((entry) => entry.returnId === FIXTURE_RETURN_ID), "Admin returns list: fixture return missing");

    const adminReturnDetail = await runCheck("Admin return detail", () => adminApi.get(`/admin/returns/${returnFixture._id}`));
    expectSuccess(adminReturnDetail, "Admin return detail");
    assert.strictEqual(adminReturnDetail.data?.data?.returnReq?.returnId, FIXTURE_RETURN_ID, "Admin return detail: wrong fixture return");

    const adminReplacements = await runCheck("Admin replacements list", () => adminApi.get("/admin/replacements"));
    expectSuccess(adminReplacements, "Admin replacements list");
    assert(Array.isArray(adminReplacements.data?.data?.replacements), "Admin replacements list: replacements should be an array");
    assert(adminReplacements.data.data.replacements.some((entry) => entry.replacementId === FIXTURE_REPLACEMENT_ID), "Admin replacements list: fixture replacement missing");

    const adminReplacementDetail = await runCheck("Admin replacement detail", () => adminApi.get(`/admin/replacements/${replacementFixture._id}`));
    expectSuccess(adminReplacementDetail, "Admin replacement detail");
    assert.strictEqual(adminReplacementDetail.data?.data?.repl?.replacementId, FIXTURE_REPLACEMENT_ID, "Admin replacement detail: wrong fixture replacement");

    const sellerOrders = await runCheck("Seller orders list", () => sellerApi.get("/seller/orders"));
    expectSuccess(sellerOrders, "Seller orders list");
    assert(sellerOrders.data.data.orders.some((entry) => entry.orderId === FIXTURE_SHIPMENT_ORDER_ID), "Seller orders list: fixture order missing");

    const sellerOrderDetail = await runCheck("Seller order detail", () => sellerApi.get(`/seller/orders/${shipmentOrder._id}`));
    expectSuccess(sellerOrderDetail, "Seller order detail");
    assert.strictEqual(sellerOrderDetail.data?.data?.order?.sellerItems?.length, 1, "Seller order detail: expected exactly one seller item");

    const sellerReturns = await runCheck("Seller returns list", () => sellerApi.get("/seller/returns"));
    expectSuccess(sellerReturns, "Seller returns list");
    assert(sellerReturns.data.data.returns.some((entry) => entry.returnId === FIXTURE_RETURN_ID), "Seller returns list: fixture return missing");

    const sellerReturnDetail = await runCheck("Seller return detail", () => sellerApi.get(`/seller/returns/${returnFixture._id}`));
    expectSuccess(sellerReturnDetail, "Seller return detail");
    assert.strictEqual(sellerReturnDetail.data?.data?.returnReq?.returnId, FIXTURE_RETURN_ID, "Seller return detail: wrong fixture return");

    const userOrders = await runCheck("User orders list", () => userApi.get("/user/orders"));
    expectSuccess(userOrders, "User orders list");
    assert(userOrders.data.data.orders.some((entry) => entry.orderId === FIXTURE_SHIPMENT_ORDER_ID), "User orders list: shipment fixture missing");

    const userOrderDetail = await runCheck("User order detail", () => userApi.get(`/user/orders/${shipmentOrder._id}`));
    expectSuccess(userOrderDetail, "User order detail");
    assert.strictEqual(userOrderDetail.data?.data?.order?.orderId, FIXTURE_SHIPMENT_ORDER_ID, "User order detail: wrong fixture order");

    const userReturns = await runCheck("User returns list", () => userApi.get("/user/returns"));
    expectSuccess(userReturns, "User returns list");
    assert(userReturns.data.data.returns.some((entry) => entry.returnId === FIXTURE_RETURN_ID), "User returns list: fixture return missing");

    const userReplacements = await runCheck("User replacements list", () => userApi.get("/user/replacements"));
    expectSuccess(userReplacements, "User replacements list");
    assert(userReplacements.data.data.replacements.some((entry) => entry.replacementId === FIXTURE_REPLACEMENT_ID), "User replacements list: fixture replacement missing");

    console.log(`Ops smoke tests passed (${results.length} checks).`);
  } finally {
    await stopServer(server);
    await mongoose.disconnect();
  }
};

main().catch((err) => {
  console.error("Ops smoke tests failed.");
  console.error(err.stack || err.message || err);
  process.exit(1);
});
