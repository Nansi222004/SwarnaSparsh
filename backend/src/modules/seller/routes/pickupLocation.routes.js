const router = require("express").Router();
const ctrl = require("../controllers/pickupLocation.controller");

// All routes protected by authenticate + requireRole("seller") from parent.

router.get("/",                           ctrl.listPickupLocations);
router.post("/",                          ctrl.createPickupLocation);
router.get("/:locationId",                ctrl.getPickupLocation);
router.put("/:locationId",                ctrl.updatePickupLocation);
router.delete("/:locationId",             ctrl.deletePickupLocation);
router.patch("/:locationId/set-default",  ctrl.setDefaultPickupLocation);
router.post("/:locationId/sync",          ctrl.syncWithShiprocket);

module.exports = router;
