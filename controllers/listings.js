const Listing = require("../models/listing");
const { cloudinary } = require("../cloudConfig");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

//Index
module.exports.index = async (req, res) => {
    const allListings =  await Listing.find({});
    res.render("listings/index.ejs", { allListings });
};

//New

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};

//Show

module.exports.showListings = async (req, res) => {
    let {id} = req.params; 
    const listing = await Listing.findById(id)
    .populate(
        {path: "reviews",
            populate: {
                path: "author"
            },
        })
        .populate("owner");
    if(!listing){
        req.flash("error", "Listing you requested for does not exist!");
        res.redirect("/listings");
    }
    
    res.render("listings/show.ejs", { listing })
};

//Create

module.exports.createListings = async (req, res, next) => {

    let response = await  geocodingClient.forwardGeocode({
        query: req.body.listing.location,
        limit: 1,
      })
        .send();

    

       
    
    // if(!req.body.listing){
    //     throw new ExpressError(400, "Send valid data for listings.");
    // }
    const { path, filename } = req.file;
    // console.log(path, "...", filename);

const newListing = new Listing(req.body.listing);

newListing.owner = req.user._id;
newListing.image = {url: path, filename };
newListing.geometry =  response.body.features[0].geometry;
// // if(!newListing.title){
// //     throw new ExpressError(400, "Title is missing.");
// // }
let  savedListing = await newListing.save();
req.flash("success", "New listing Created!");
res.redirect("/listings");

// const { error } = listingSchema.validate(req.body);
// if (error) {
//     throw new ExpressError(error.details[0].message, 400);
// }
// const newListing = new Listing(req.body.listing);
// await newListing.save();
// res.redirect("/listings");

};


//Edit

module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if(!listing){
        req.flash("error", "Listing you requested for does not exist!");
        res.redirect("/listings");
    }

    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload" , "/upload/w_250");
    res.render("listings/edit.ejs", { listing, originalImageUrl });
};


//Update

module.exports.updateListings = async (req, res) => {
    let { id } = req.params;

    let coordinate = await geocodingClient
    .forwardGeocode({
      query: ` ${req.body.listing.location},${req.body.listing.country}`,
      limit: 2,
    })
    .send();

    req.body.listing.geometry = coordinate.body.features[0].geometry;
    let updatedListing = await Listing.findByIdAndUpdate(id, req.body.listing);
    // let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });


    if (!updatedListing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    }


    if(req.file) {
    const { path, filename } = req.file;
    updatedListing.image = {url: path, filename };
    await updatedListing.save();
    }

    
    req.flash("success", "Listing Updated.");
    res.redirect(`/listings/${id}`);
};

// --- Display listings by category ---

module.exports.filter = async (req, res, next) => {
    let { id } = req.params;
    let allListings = await Listing.find({ category: { $all: [id] } });
    // console.log(allListings);
    if (allListings.length != 0) {
      res.locals.success = `Listings Find by ${id}`;
      res.render("listings/index.ejs", { allListings });
    } else {
      req.flash("error", "Listings not present!");
      res.redirect("/listings");
    }
  };
  
  // --- Search ---
  
  module.exports.search = async (req, res) => {
    console.log(req.query.q);
    let input = req.query.q.trim().replace(/\s+/g, " ");
    // console.log(input);
    if (input == "" || input == " ") {
      req.flash("error", "Search value empty !");
      res.redirect("/listings");
    }
  
    let data = input.split("");
    let element = "";
    let flag = false;
    for (let index = 0; index < data.length; index++) {
      if (index == 0 || flag) {
        element = element + data[index].toUpperCase();
      } else {
        element = element + data[index].toLowerCase();
      }
      flag = data[index] == " ";
    }
    console.log(element);
    let allListings = await Listing.find({
      title: { $regex: element, $options: "i" },
    });
    if (allListings.length != 0) {
      res.locals.success = "Listings searched by Title";
      res.render("listings/index.ejs", { allListings });
      return;
    }
  
    if (allListings.length == 0) {
      allListings = await Listing.find({
        category: { $regex: element, $options: "i" },
      }).sort({ _id: -1 });
      if (allListings.length != 0) {
        res.locals.success = "Listings searched by Category";
        res.render("listings/index.ejs", { allListings });
        return;
      }
    }
    if (allListings.length == 0) {
      allListings = await Listing.find({
        country: { $regex: element, $options: "i" },
      }).sort({ _id: -1 });
      if (allListings.length != 0) {
        res.locals.success = "Listings searched by Location";
        res.render("listings/index.ejs", { allListings });
        return;
      }
    }
  
    const intValue = parseInt(element, 10);
    const intDec = Number.isInteger(intValue);
  
    if (allListings.length == 0 && intDec) {
      allListings = await Listing.find({ price: { $lte: element } }).sort({
        price: 1,
      });
      if (allListings.length != 0) {
        res.locals.success = `Listings searched for less than Rs ${element}`;
        res.render("listings/index.ejs", { allListings });
        return;
      }
    }
    if (allListings.length == 0) {
      req.flash("error", "Listings is not here !!!");
      res.redirect("/listings");
    }
  };


//Delete
module.exports.deleteListings = async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing); 
    req.flash("success", "Listing Removed!")
    res.redirect("/listings");
};