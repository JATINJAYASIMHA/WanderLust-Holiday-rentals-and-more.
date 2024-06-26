const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const Listing = require("../models/listing");
const {isLoggedIn, isOwner, validateListing} = require("../middleware");

const listingController = require("../controllers/listings");
const multer = require("multer");
const { storage } = require("../cloudConfig");
const upload = multer({storage});


router
.route("/")
    .get( wrapAsync(listingController.index))
    .post(
        isLoggedIn,
        upload.single('image'),
        validateListing, 
        
        wrapAsync(listingController.createListings));
    
//New Route
router.get("/new", isLoggedIn , listingController.renderNewForm);
router.get("/search", listingController.search);

// Category route
router.get("/filter/:id", wrapAsync(listingController.filter));

router
.route("/:id")
    .get( wrapAsync(listingController.showListings))
    .put( 
        isLoggedIn, 
        isOwner , 
        upload.single('image'),
        validateListing, 
        wrapAsync(listingController.updateListings))
    .delete( isLoggedIn, isOwner ,wrapAsync(listingController.deleteListings));


//Index Route
// router.get("/", wrapAsync(listingController.index));



//Show Route
// router.get("/:id", wrapAsync(listingController.showListings));


// Create Route
// router.post("/",isLoggedIn, validateListing, wrapAsync(listingController.createListings));


//Edit Route
router.get("/:id/edit",isLoggedIn,isOwner, wrapAsync(listingController.renderEditForm));

//Update Route 
// router.put("/:id", isLoggedIn, isOwner ,validateListing, wrapAsync(listingController.updateListings));

//Delete Route
// router.delete("/:id", isLoggedIn, isOwner ,wrapAsync(listingController.deleteListings));





module.exports = router;