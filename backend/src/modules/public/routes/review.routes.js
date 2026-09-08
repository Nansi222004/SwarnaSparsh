const router = require("express").Router();
const reviewController = require("../controllers/review.controller");
const authenticate = require("../../../middlewares/authenticate");

router.get("/", reviewController.getReviews);
router.post("/", authenticate, reviewController.createReview);

module.exports = router;
