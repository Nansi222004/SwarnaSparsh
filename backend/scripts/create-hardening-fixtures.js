require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");

const User = require("../src/models/User");
const Seller = require("../src/models/Seller");
const Product = require("../src/models/Product");
const Order = require("../src/models/Order");
const Return = require("../src/models/Return");
const Replacement = require("../src/models/Replacement");

const FIXTURE_USER = {
  name: "Hardening Verification User",
  phone: "9000000001",
  email: "hardening.verification@sands.com",
};

const FIXTURE_PRODUCT = {
  name: "Hardening Verification Seller Product",
  slug: "hardening-verification-seller-product",
  productCode: "HARDEN001",
  huid: "HARDEN001",
};
const FIXTURE_PRODUCT_BASELINE = {
  stock: 17,
  sold: 3,
  price: 499,
  mrp: 499,
  metalPrice: 300,
  gst: 15,
  finalPrice: 499,
};

const FIXTURE_ORDER_IDS = {
  shipment: "ORD-HARDEN-SHIP-01",
  return: "ORD-HARDEN-RETURN-01",
  replacement: "ORD-HARDEN-REPLACE-01",
};

const FIXTURE_RETURN_ID = "RET-HARDEN-01";
const FIXTURE_REPLACEMENT_ID = "REP-HARDEN-01";

const shippingAddress = {
  firstName: "Hardening",
  lastName: "Verifier",
  email: FIXTURE_USER.email,
  phone: FIXTURE_USER.phone,
  flatNo: "Fixture-01",
  area: "Verification Lane",
  city: "Indore",
  district: "Indore",
  state: "Madhya Pradesh",
  pincode: "452010",
};

const buildTimeline = (statuses) =>
  statuses.map((entry) => ({
    status: entry.status,
    note: entry.note,
    date: entry.date || new Date(),
  }));

const ensureConnection = async () => {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(process.env.MONGO_URI);
};

const ensureFixtureUser = async () => {
  let user = await User.findOne({ email: FIXTURE_USER.email });
  if (user) return user;

  user = await User.create({
    ...FIXTURE_USER,
    role: "user",
  });
  return user;
};

const ensureFixtureSeller = async () => {
  const preferredSellerId = "69be48b30acb4daba1c53c3f";
  let seller = await Seller.findById(preferredSellerId);
  if (seller) return seller;

  seller = await Seller.findOne({ status: "APPROVED" }).sort({ createdAt: 1 });
  if (!seller) {
    throw new Error("No approved seller found to attach hardening fixtures.");
  }
  return seller;
};

const ensureFixtureProduct = async (sellerId) => {
  let product = await Product.findOne({ slug: FIXTURE_PRODUCT.slug });
  if (product) {
    if (Array.isArray(product.variants) && product.variants[0]) {
      product.variants[0].stock = FIXTURE_PRODUCT_BASELINE.stock;
      product.variants[0].sold = FIXTURE_PRODUCT_BASELINE.sold;
      product.variants[0].price = FIXTURE_PRODUCT_BASELINE.price;
      product.variants[0].mrp = FIXTURE_PRODUCT_BASELINE.mrp;
      product.variants[0].metalPrice = FIXTURE_PRODUCT_BASELINE.metalPrice;
      product.variants[0].gst = FIXTURE_PRODUCT_BASELINE.gst;
      product.variants[0].finalPrice = FIXTURE_PRODUCT_BASELINE.finalPrice;
    }
    product.sellerId = sellerId;
    product.status = "Draft";
    product.active = false;
    product.showInNavbar = false;
    product.showInCollection = false;
    product.isSerialized = false;
    await product.save();
    return product;
  }

  product = await Product.create({
    ...FIXTURE_PRODUCT,
    description: "Controlled seller-owned fixture product for hardening verification only.",
    stylingTips: "",
    careTips: "",
    specifications: "Fixture product used for verification scenarios.",
    supplierInfo: "Internal hardening fixture",
    material: "Silver",
    silverCategory: "925",
    images: [],
    variants: [{
      name: "Verification Variant",
      variantCode: "VAR-HARDEN001-01",
      weight: 10,
      weightUnit: "Grams",
      makingCharge: 100,
      diamondPrice: 0,
      mrp: FIXTURE_PRODUCT_BASELINE.mrp,
      price: FIXTURE_PRODUCT_BASELINE.price,
      metalPrice: FIXTURE_PRODUCT_BASELINE.metalPrice,
      gst: FIXTURE_PRODUCT_BASELINE.gst,
      finalPrice: FIXTURE_PRODUCT_BASELINE.finalPrice,
      stock: FIXTURE_PRODUCT_BASELINE.stock,
      sold: FIXTURE_PRODUCT_BASELINE.sold,
      serialCodes: [],
      variantImages: [],
      variantFaqs: [],
    }],
    sellerId,
    status: "Draft",
    active: false,
    showInNavbar: false,
    showInCollection: false,
    isSerialized: false,
    faqs: [],
  });

  return product;
};

const buildOrderItem = (product, sellerId) => {
  const variant = product.variants[0];
  return {
    productId: product._id,
    variantId: variant._id,
    name: product.name,
    sku: `${product.slug}-${variant.name}`,
    image: product.images?.[0] || "",
    price: variant.price,
    mrp: variant.mrp,
    quantity: 1,
    sellerId,
  };
};

const ensureOrder = async ({ orderId, userId, product, sellerId, status, timeline, note }) => {
  let order = await Order.findOne({ orderId });
  if (order) return order;

  const item = buildOrderItem(product, sellerId);
  order = await Order.create({
    orderId,
    userId,
    customerName: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
    customerEmail: shippingAddress.email,
    customerPhone: shippingAddress.phone,
    items: [item],
    shippingAddress,
    paymentMethod: "cod",
    paymentStatus: "cod",
    subtotal: item.price,
    discount: 0,
    shipping: 49,
    total: item.price + 49,
    status,
    timeline,
    notes: note,
  });

  return order;
};

const ensureReturn = async ({ userId, order, product }) => {
  let returnReq = await Return.findOne({ returnId: FIXTURE_RETURN_ID });
  const item = buildOrderItem(product, product.sellerId);

  // If the fixture already exists (from older runs), keep its _id stable but repair
  // any stale product/variant refs so seller-scoped queries work reliably.
  if (returnReq) {
    const existing = returnReq.items?.[0] || {};
    const needsRepair =
      !existing.productId ||
      String(existing.productId) !== String(item.productId) ||
      !existing.variantId ||
      String(existing.variantId) !== String(item.variantId) ||
      String(returnReq.orderId) !== String(order._id) ||
      String(returnReq.userId) !== String(userId) ||
      returnReq.returnNumber !== 99999; // Ensure returnNumber is updated if corrupted

    if (needsRepair) {
      await Return.updateOne(
        { _id: returnReq._id },
        {
          $set: {
            orderId: order._id,
            userId,
            returnNumber: 99999,
            items: [{
              productId: item.productId,
              variantId: item.variantId,
              name: item.name,
              sku: item.sku,
              qty: item.quantity,
              price: item.price,
              reason: "Hardening verification return request",
            }],
            status: "Pending",
            updatedAt: new Date(),
          }
        }
      );
    }

    returnReq = await Return.findOne({ returnId: FIXTURE_RETURN_ID });
    return returnReq;
  }

  const now = new Date();
  await Return.collection.insertOne({
    returnId: FIXTURE_RETURN_ID,
    returnNumber: 99999,
    orderId: order._id,
    userId,
    items: [{
      productId: item.productId,
      variantId: item.variantId,
      name: item.name,
      sku: item.sku,
      qty: item.quantity,
      price: item.price,
      reason: "Hardening verification return request",
    }],
    evidence: {
      reason: "Hardening verification return request",
      comment: "Controlled fixture for seller/admin return detail verification.",
      images: [],
    },
    pickupAddress: {
      line1: `${shippingAddress.flatNo}, ${shippingAddress.area}`,
      city: shippingAddress.city,
      state: shippingAddress.state,
      pincode: shippingAddress.pincode,
    },
    status: "Pending",
    timeline: buildTimeline([
      { status: "Requested", note: "Hardening fixture return created" },
    ]),
    logs: [{
      action: "FIXTURE_CREATED",
      comment: "Created by hardening fixture script",
      by: "system",
      date: new Date(),
    }],
    adminComment: "Hardening fixture return",
    requestDate: now,
    createdAt: now,
    updatedAt: now,
  });

  returnReq = await Return.findOne({ returnId: FIXTURE_RETURN_ID });
  return returnReq;
};

const ensureReplacement = async ({ userId, order, product }) => {
  let replacement = await Replacement.findOne({ replacementId: FIXTURE_REPLACEMENT_ID });
  const item = buildOrderItem(product, product.sellerId);

  // If the fixture already exists (from older runs), repair stale product/variant refs so
  // inventory restock tests (and seller scoping) remain deterministic.
  if (replacement) {
    const existingOriginal = replacement.originalItems?.[0] || {};
    const existingReplacement = replacement.replacementItems?.[0] || {};

    const needsRepair =
      !existingOriginal.productId ||
      String(existingOriginal.productId) !== String(item.productId) ||
      !existingOriginal.variantId ||
      String(existingOriginal.variantId) !== String(item.variantId) ||
      !existingReplacement.productId ||
      String(existingReplacement.productId) !== String(item.productId) ||
      !existingReplacement.variantId ||
      String(existingReplacement.variantId) !== String(item.variantId) ||
      String(replacement.orderId) !== String(order._id) ||
      String(replacement.userId) !== String(userId);

    if (needsRepair) {
      await Replacement.updateOne(
        { _id: replacement._id },
        {
          $set: {
            orderId: order._id,
            userId,
            originalItems: [{
              productId: item.productId,
              variantId: item.variantId,
              name: item.name,
              sku: item.sku,
              qty: item.quantity,
              price: item.price,
              reason: "Hardening verification replacement request",
            }],
            replacementItems: [{
              productId: item.productId,
              variantId: item.variantId,
              name: item.name,
              sku: item.sku,
              qty: item.quantity,
            }],
            updatedAt: new Date(),
          }
        }
      );
    }

    replacement = await Replacement.findOne({ replacementId: FIXTURE_REPLACEMENT_ID });
    return replacement;
  }

  replacement = await Replacement.create({
    replacementId: FIXTURE_REPLACEMENT_ID,
    orderId: order._id,
    userId,
    type: "Same Product",
    originalItems: [{
      productId: item.productId,
      variantId: item.variantId,
      name: item.name,
      sku: item.sku,
      qty: item.quantity,
      price: item.price,
      reason: "Hardening verification replacement request",
    }],
    replacementItems: [{
      productId: item.productId,
      variantId: item.variantId,
      name: item.name,
      sku: item.sku,
      qty: item.quantity,
    }],
    evidence: {
      reason: "Hardening verification replacement request",
      comment: "Controlled fixture for admin replacement lifecycle verification.",
      images: [],
    },
    status: "Pending",
    replacementMode: "after_pickup",
    timeline: buildTimeline([
      { status: "Requested", note: "Hardening fixture replacement created" },
    ]),
    adminComment: "Hardening fixture replacement",
  });

  return replacement;
};

const main = async () => {
  await ensureConnection();

  const user = await ensureFixtureUser();
  const seller = await ensureFixtureSeller();
  const product = await ensureFixtureProduct(seller._id);

  const shipmentOrder = await ensureOrder({
    orderId: FIXTURE_ORDER_IDS.shipment,
    userId: user._id,
    product,
    sellerId: seller._id,
    status: "Processing",
    timeline: buildTimeline([
      { status: "Ordered", note: "Hardening fixture shipment order created" },
      { status: "Processing", note: "Ready for seller shipment verification" },
    ]),
    note: "HARDENING_FIXTURE: shipment-flow",
  });

  const returnOrder = await ensureOrder({
    orderId: FIXTURE_ORDER_IDS.return,
    userId: user._id,
    product,
    sellerId: seller._id,
    status: "Return Requested",
    timeline: buildTimeline([
      { status: "Ordered", note: "Hardening fixture return order created" },
      { status: "Processing", note: "Order confirmed in fixture flow" },
      { status: "Delivered", note: "Fixture delivered for return verification" },
      { status: "Return Requested", note: "Return fixture linked to this order" },
    ]),
    note: "HARDENING_FIXTURE: return-flow",
  });

  const replacementOrder = await ensureOrder({
    orderId: FIXTURE_ORDER_IDS.replacement,
    userId: user._id,
    product,
    sellerId: seller._id,
    status: "Return Requested",
    timeline: buildTimeline([
      { status: "Ordered", note: "Hardening fixture replacement order created" },
      { status: "Processing", note: "Order confirmed in fixture flow" },
      { status: "Delivered", note: "Fixture delivered for replacement verification" },
      { status: "Return Requested", note: "Replacement fixture linked to this order" },
    ]),
    note: "HARDENING_FIXTURE: replacement-flow",
  });

  const returnReq = await ensureReturn({ userId: user._id, order: returnOrder, product });
  const replacement = await ensureReplacement({ userId: user._id, order: replacementOrder, product });

  console.log(JSON.stringify({
    user: { id: user._id, email: user.email, phone: user.phone },
    seller: { id: seller._id, email: seller.email },
    product: { id: product._id, slug: product.slug },
    orders: {
      shipment: { id: shipmentOrder._id, orderId: shipmentOrder.orderId, status: shipmentOrder.status },
      return: { id: returnOrder._id, orderId: returnOrder.orderId, status: returnOrder.status },
      replacement: { id: replacementOrder._id, orderId: replacementOrder.orderId, status: replacementOrder.status },
    },
    returnReq: { id: returnReq._id, returnId: returnReq.returnId, status: returnReq.status },
    replacement: { id: replacement._id, replacementId: replacement.replacementId, status: replacement.status },
  }, null, 2));
};

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });
