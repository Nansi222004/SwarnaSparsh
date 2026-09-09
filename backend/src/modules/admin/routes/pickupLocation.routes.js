const router = require("express").Router();
const pickupLocationController = require("../controllers/pickupLocation.controller");

// All routes are behind authenticate + requireRole("admin") from the parent router.
router.get("/", pickupLocationController.listPickupLocations);
router.post("/", pickupLocationController.createPickupLocation);
router.get("/:locationId", pickupLocationController.getPickupLocation);
router.put("/:locationId", pickupLocationController.updatePickupLocation);
router.delete("/:locationId", pickupLocationController.deletePickupLocation);
router.patch("/:locationId/default", pickupLocationController.setDefaultPickupLocation);
router.post("/:locationId/sync-shiprocket", pickupLocationController.syncWithShiprocket);

module.exports = router;
