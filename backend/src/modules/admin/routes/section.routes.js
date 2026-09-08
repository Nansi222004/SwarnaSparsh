const router = require("express").Router();
const sectionController = require("../controllers/section.controller");
const { sectionUpload } = require("../../../middlewares/uploadMiddleware");
const { error } = require("../../../utils/apiResponse");

router.get("/", sectionController.getSections);
router.post("/bulk", sectionController.bulkUpsertSections);
router.post("/upload-image", (req, res, next) => {
  sectionUpload.single("image")(req, res, (err) => {
    if (!err) return next();

    if (err.code === "LIMIT_FILE_SIZE") {
      return error(res, "Image is too large. Please upload an image smaller than 10 MB.", 400);
    }

    return error(res, err.message || "Failed to upload image", 400);
  });
}, sectionController.uploadSectionImage);
router.get("/:id", sectionController.getSectionDetail);
router.put("/:id", sectionController.upsertSection);

module.exports = router;
