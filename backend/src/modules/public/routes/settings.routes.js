const router = require("express").Router();
const settingsController = require("../../admin/controllers/settings.controller");

router.get("/", settingsController.getSettings);

module.exports = router;
