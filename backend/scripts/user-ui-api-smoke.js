require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const path = require("path");
const assert = require("assert");
const { execFileSync } = require("child_process");
const axios = require("axios");
const mongoose = require("mongoose");

const app = require("../src/app");
const OTP = require("../src/models/OTP");
const Product = require("../src/models/Product");
const User = require("../src/models/User");

const FIXTURE_PHONE = "9000000001"; // created by create-hardening-fixtures.js
const FIXTURE_EMAIL = "hardening.verification@sands.com";

const startServer = () =>
  new Promise((resolve) => {
    const server = app.listen(0, () => resolve(server));
  });

const stopServer = (server) =>
  new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });

const runFixtureSetup = () => {
  execFileSync(process.execPath, [path.join(__dirname, "create-hardening-fixtures.js")], {
    cwd: path.join(__dirname, ".."),
    stdio: "inherit",
  });
};

const expectSuccess = (response, label) => {
  // Some endpoints intentionally return 201 (created) while still using the same {success:true} envelope.
  assert(
    response.status >= 200 && response.status < 300,
    `${label}: expected HTTP 2xx`
  );
  assert.strictEqual(response.data?.success, true, `${label}: expected success=true`);
};

const main = async () => {
  runFixtureSetup();
  await mongoose.connect(process.env.MONGO_URI);

  const fixtureUser = await User.findOne({ phone: FIXTURE_PHONE }).lean();
  assert(fixtureUser, "Missing fixture user. Fixture setup should have created it.");

  const fixtureProduct = await Product.findOne({ slug: "hardening-verification-seller-product" }).lean();
  assert(fixtureProduct && fixtureProduct.variants?.[0], "Missing fixture product/variant for smoke tests.");

  const server = await startServer();
  const port = server.address().port;
  const baseURL = `http://127.0.0.1:${port}/api`;

  const publicApi = axios.create({ baseURL });
  const results = [];
  const mark = (label) => results.push(label);

  try {
    // 1) OTP login as the fixture user (same account used by ops suites)
    let res = await publicApi.post("/auth/send-otp", { phone: FIXTURE_PHONE });
    expectSuccess(res, "Send OTP");
    mark("OTP send");

    const otpRecord = await OTP.findOne({ phone: FIXTURE_PHONE }).lean();
    assert(otpRecord?.otp, "OTP record missing in DB after send-otp");

    res = await publicApi.post("/auth/verify-otp", {
      phone: FIXTURE_PHONE,
      otp: otpRecord.otp,
      name: "Hardening Verification User",
      email: FIXTURE_EMAIL,
    });
    expectSuccess(res, "Verify OTP");
    const token = res.data?.data?.token;
    assert(token, "Verify OTP: missing token");
    mark("OTP verify/login");

    const userApi = axios.create({
      baseURL,
      headers: { Authorization: `Bearer ${token}` },
    });

    // 2) Wishlist add/remove
    res = await userApi.get("/user/wishlist");
    expectSuccess(res, "Wishlist list");
    mark("Wishlist list");

    res = await userApi.post("/user/wishlist", { productId: String(fixtureProduct._id) });
    expectSuccess(res, "Wishlist add");
    mark("Wishlist add");

    res = await userApi.delete(`/user/wishlist/${fixtureProduct._id}`);
    expectSuccess(res, "Wishlist remove");
    mark("Wishlist remove");

    // 3) Addresses CRUD (create + default + update + delete)
    res = await userApi.get("/user/addresses");
    expectSuccess(res, "Addresses list (pre)");
    mark("Addresses list (pre)");

    const newAddressPayload = {
      name: "Hardening Verification User",
      phone: FIXTURE_PHONE,
      flatNo: "API-SMOKE-01",
      area: "Automation Street",
      city: "Indore",
      district: "Indore",
      state: "Madhya Pradesh",
      pincode: "452010",
    };

    res = await userApi.post("/user/addresses", newAddressPayload);
    expectSuccess(res, "Addresses create");
    mark("Addresses create");

    res = await userApi.get("/user/addresses");
    expectSuccess(res, "Addresses list (post)");
    const addresses = res.data?.data?.addresses || res.data?.data || [];
    const created = (Array.isArray(addresses) ? addresses : []).find((a) => a?.flatNo === "API-SMOKE-01");
    assert(created?._id, "Created address missing from list");
    mark("Addresses list (post)");

    res = await userApi.patch(`/user/addresses/${created._id}/set-default`);
    expectSuccess(res, "Addresses set-default");
    mark("Addresses set-default");

    res = await userApi.put(`/user/addresses/${created._id}`, { ...newAddressPayload, area: "Automation Street Updated" });
    expectSuccess(res, "Addresses update");
    mark("Addresses update");

    res = await userApi.delete(`/user/addresses/${created._id}`);
    expectSuccess(res, "Addresses delete");
    mark("Addresses delete");

    // 4) Orders list + detail
    res = await userApi.get("/user/orders");
    expectSuccess(res, "Orders list");
    const orders = res.data?.data?.orders || [];
    assert(Array.isArray(orders), "Orders list: orders should be an array");
    assert(orders.length > 0, "Orders list: expected at least 1 order for fixture user");
    mark("Orders list");

    const anyOrderId = orders[0]?._id || orders[0]?.id;
    assert(anyOrderId, "Orders list: missing order id");

    res = await userApi.get(`/user/orders/${anyOrderId}`);
    expectSuccess(res, "Order detail");
    mark("Order detail");

    // 5) Returns + replacements lists
    res = await userApi.get("/user/returns");
    expectSuccess(res, "Returns list");
    mark("Returns list");

    res = await userApi.get("/user/replacements");
    expectSuccess(res, "Replacements list");
    mark("Replacements list");

    // 6) Notifications (should be accessible; may be empty)
    res = await userApi.get("/user/notifications");
    expectSuccess(res, "Notifications list");
    mark("Notifications list");

    console.log(`User UI API smoke passed (${results.length} checks):`);
    for (const label of results) console.log(`- ${label}`);
  } finally {
    await stopServer(server);
    await mongoose.disconnect();
  }
};

main().catch((err) => {
  console.error("User UI API smoke tests failed.");
  console.error(err.stack || err.message || err);
  process.exit(1);
});
