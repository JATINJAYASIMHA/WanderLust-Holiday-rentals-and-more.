const express = require("express");
const router = express.Router({mergeParams: true});
const wrapAsync = require("../utils/wrapAsync");
const Review = require("../models/reviews");
const Listing = require("../models/listing");
const {isLoggedIn, validateReview, isReviewAuthor } = require("../middleware");

const reviewController = require("../controllers/reviews");

//Reviews
//Post Review Route

router.post("/",isLoggedIn,validateReview, wrapAsync(reviewController.createReview));
 
 //Delete Review Route
 
 router.delete("/:reviewId",isLoggedIn,isReviewAuthor, wrapAsync(reviewController.destroyReview));

 module.exports = router;
   