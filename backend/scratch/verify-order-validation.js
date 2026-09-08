const assert = require("assert");
const { placeOrderSchema } = require("../src/modules/user/validators/order.validator");

// 1. Create a mock payload containing all the fields that were previously rejected
const mockOrderPayload = {
  items: [
    {
      productId: "GIFT_CARD_500", // Previously rejected by pattern constraint
      variantId: "GIFT_CARD_VAR", // Previously rejected by pattern constraint
      quantity: 1,
      isGiftCard: true,           // Previously disallowed
      personalization: {
        to: "Recipient Name",
        message: "Happy Birthday!"
      },                          // Previously disallowed
      price: 500,                 // Previously disallowed
      name: "Sands E-Gift Card"   // Previously disallowed
    },
    {
      productId: "69e9fdb01caeb20821454810", // Standard ObjectId string format
      variantId: "69e9fdb01caeb20821454811", // Standard ObjectId string format
      quantity: 2
    }
  ],
  shippingAddress: {
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "9876543210",
    flatNo: "Flat 101",
    area: "Baker Street",
    city: "London",
    district: "Westminster",
    state: "London",
    pincode: "123456"
  },
  paymentMethod: "cod",
  couponCode: "WELCOME10",
  giftCardCodes: ["GC-ABC123XYZ", "GC-DEF456UVW"] // Previously disallowed
};

console.log("Validating payload against updated placeOrderSchema...");
const { error, value } = placeOrderSchema.validate(mockOrderPayload);

if (error) {
  console.error("❌ Validation Failed!");
  console.error(error.details);
  process.exit(1);
} else {
  console.log("🎉 SUCCESS! Joi schema validated the order payload with 100% correctness!");
  console.log("Validated output value:", JSON.stringify(value, null, 2));
  process.exit(0);
}
