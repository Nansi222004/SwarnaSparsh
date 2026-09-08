const User = require("../../../models/User");
const { success, error } = require("../../../utils/apiResponse");

exports.getCart = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate({
      path: "cart.productId",
      select: "name slug productCode brand images variants status active",
    });
    
    if (!user) return error(res, "User not found", 404);

    return success(res, { cart: user.cart || [] }, "Cart retrieved");
  } catch (err) {
    return error(res, err.message);
  }
};

exports.updateCart = async (req, res) => {
  try {
    const { items } = req.body; // Expecting array of { productId, variantId, quantity }
    
    if (!Array.isArray(items)) {
      return error(res, "Items must be an array", 400);
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { cart: items },
      { new: true }
    );

    return success(res, { cart: user.cart }, "Cart updated");
  } catch (err) {
    return error(res, err.message);
  }
};

exports.addToCart = async (req, res) => {
  try {
    const { productId, variantId, quantity, isGiftCard, price, name, image, personalization } = req.body;
    
    const user = await User.findById(req.user.userId);
    if (!user) return error(res, "User not found", 404);

    const existingItemIndex = user.cart.findIndex(
      (item) => 
        String(item.productId) === String(productId) && 
        String(item.variantId) === String(variantId)
    );

    if (existingItemIndex > -1) {
      user.cart[existingItemIndex].quantity += (quantity || 1);
    } else {
      user.cart.push({ 
        productId, 
        variantId, 
        quantity: quantity || 1,
        isGiftCard: isGiftCard || false,
        price: price || 0,
        name: name || "",
        image: image || "",
        personalization: personalization || null
      });
    }

    await user.save();
    return success(res, { cart: user.cart }, "Item added to cart");
  } catch (err) {
    return error(res, err.message);
  }
};

exports.syncCart = async (req, res) => {
  try {
    const { guestItems } = req.body; // Expecting array of { id, variantId, quantity, isGiftCard, price, name, image, personalization }
    
    if (!Array.isArray(guestItems)) {
      return error(res, "Guest items must be an array", 400);
    }

    const user = await User.findById(req.user.userId);
    if (!user) return error(res, "User not found", 404);

    // Merge logic: productId + variantId
    const mergedCart = [...(user.cart || [])];

    guestItems.forEach(guestItem => {
      const productId = guestItem.id || guestItem._id || guestItem.productId;
      const variantId = guestItem.variantId;
      const quantity = guestItem.quantity || 1;

      const existingIndex = mergedCart.findIndex(
        item => String(item.productId) === String(productId) && String(item.variantId) === String(variantId)
      );

      if (existingIndex > -1) {
        // If it exists, we could either take the max quantity or sum them up. 
        // Summing up is usually safer for "merge"
        mergedCart[existingIndex].quantity += quantity;
      } else {
        mergedCart.push({ 
          productId, 
          variantId, 
          quantity,
          isGiftCard: guestItem.isGiftCard || false,
          price: guestItem.price || 0,
          name: guestItem.name || "",
          image: guestItem.image || "",
          personalization: guestItem.personalization || null
        });
      }
    });

    user.cart = mergedCart;
    await user.save();

    return success(res, { cart: user.cart }, "Cart synced successfully");
  } catch (err) {
    return error(res, err.message);
  }
};
