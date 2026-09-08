const router = require("express").Router();
const addressController = require("../controllers/address.controller");
const validate = require("../../../middlewares/validate");
const { addressSchema } = require("../validators/address.validator");
const authenticate = require("../../../middlewares/authenticate");
const requireRole = require("../../../middlewares/requireRole");
const requireActiveUser = require("../../../middlewares/requireActiveUser");

router.use(authenticate, requireRole("user", "seller", "admin"), requireActiveUser);

router.get("/", addressController.getAddresses);
router.post("/", validate(addressSchema), addressController.addAddress);
router.put("/:id", validate(addressSchema), addressController.updateAddress);
router.delete("/:id", addressController.deleteAddress);
router.patch("/:id/set-default", addressController.setDefault);

module.exports = router;
