const Return = require("../../../models/Return");
const Replacement = require("../../../models/Replacement");
const Order = require("../../../models/Order");
const { generateReturnId } = require("../../../utils/generateId");
const { success, error } = require("../../../utils/apiResponse");
const {
  createSellerNotification,
} = require("../../../services/sellerNotificationService");
const { enqueueEmail } = require("../../../services/emailService");
const emailTemplates = require("../../../services/emailTemplates");

const normalizeVoidTagId = (value) => String(value || "").trim();

exports.requestReturn = async (req, res) => {
  try {
    const { orderId, itemId, reason, description } = req.body;
    const userId = req.user.userId;

    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) return error(res, "Order not found", 404);

    if (order.status !== "Delivered") {
      return error(
        res,
        "Returns can only be requested for delivered orders",
        400,
      );
    }

    const item = order.items.id(itemId);
    if (!item) return error(res, "Item not found in order", 404);

    // Check if already requested for return flow
    const existing = await Return.findOne({
      orderId,
      "items.variantId": item.variantId,
    });
    if (existing)
      return error(res, "Return already requested for this item", 409);

    // Prevent parallel replacement + return for the same variant
    const replacementExists = await Replacement.findOne({
      orderId,
      "originalItems.variantId": item.variantId,
    });
    if (replacementExists) {
      return error(
        res,
        "Replacement already requested for this item. Please complete that flow first.",
        409,
      );
    }

    const images = req.files?.evidence
      ? req.files.evidence.map((f) => f.path)
      : [];
    const voidTagImages = req.files?.voidTagImages
      ? req.files.voidTagImages.map((f) => f.path)
      : [];
    const itemVoidTagId = normalizeVoidTagId(item.voidTagId);

    if (itemVoidTagId && voidTagImages.length === 0) {
      return error(
        res,
        "A clear photo of the intact security void tag is required for this return",
        400,
      );
    }

    const returnRequest = await Return.create({
      returnId: generateReturnId(),
      userId,
      orderId,
      items: [
        {
          productId: item.productId,
          variantId: item.variantId,
          name: item.name,
          sku: item.sku,
          voidTagId: itemVoidTagId,
          qty: item.quantity,
          price: item.price,
          reason,
        },
      ],
      evidence: { reason, comment: description, images, voidTagImages },
      status: "Pending",
      voidTagVerification: itemVoidTagId
        ? { status: "Pending", notes: "" }
        : undefined,
      timeline: [{ status: "Requested", note: "Return request submitted" }],
    });

    order.status = "Return Requested";
    order.timeline = Array.isArray(order.timeline) ? order.timeline : [];
    order.timeline.push({
      status: "Return Requested",
      note: `Return requested for ${item.name || "order item"}`,
      date: new Date(),
    });
    await order.save();

    // Notify seller (if this item belongs to a seller listing).
    if (item?.sellerId) {
      await createSellerNotification({
        sellerId: item.sellerId,
        title: "Return requested",
        message: `Return requested for order ${order.orderId || order._id}. Item: ${item.name || "Order item"}.`,
        type: "RETURN",
        priority: "High",
        link: `/seller/return-details/${returnRequest._id}`,
      });
    }

    // -- Email: return request confirmation to customer --
    const reqUser = await require("../../../models/User")
      .findById(userId)
      .select("email name");
    if (reqUser && reqUser.email) {
      enqueueEmail({
        to: reqUser.email,
        subject:
          "Return Request Received - " +
          returnRequest.returnId +
          " | Swarna Sparsh",
        html: emailTemplates.returnRequested({
          returnReq: returnRequest,
          userName: reqUser.name,
          order,
        }),
        type: "return_requested",
      });
    }

    return success(
      res,
      { returnRequest },
      "Return requested successfully",
      201,
    );
  } catch (err) {
    return error(res, err.message);
  }
};

exports.getMyReturns = async (req, res) => {
  try {
    const returns = await Return.find({ userId: req.user.userId })
      .populate("orderId", "orderId")
      .sort({ createdAt: -1 });
    return success(res, { returns }, "Returns retrieved");
  } catch (err) {
    return error(res, err.message);
  }
};
