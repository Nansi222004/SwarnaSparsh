const router = require("express").Router();
const reviewController = require("../controllers/review.controller");
const authenticate = require("../../../middlewares/authenticate");
const requireRole = require("../../../middlewares/requireRole");

router.use(authenticate, requireRole("admin"));

router.get("/", reviewController.getReviews);
router.patch("/:id/toggle", reviewController.toggleReview);
router.delete("/:id", reviewController.deleteReview);

module.exports = router;
