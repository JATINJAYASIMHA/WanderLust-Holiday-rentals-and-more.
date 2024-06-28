if(process.env.NODE_ENV != "production") {
require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
// const Listing = require("../E-Commerce Website/models/listing");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
// const wrapAsync = require("./utils/wrapAsync");
const ExpressError = require("./utils/ExpressError");
// const {  listingSchema, reviewSchema }  = require("./schema");
// const Review = require("./models/reviews");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user");
const googleRoute = require("./routes/google.js");
const githubRoute = require("./routes/github.js");


const listingRouter = require("./routes/listing");
const reviewRouter = require("./routes/review");
const userRouter = require("./routes/user");
const { isLoggedIn, validateReview } = require("./middleware.js");


// const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
const dbUrl = process.env.ATLASDB_URL;

main().then(()=>{
    console.log("connected to db");
}).catch((err)=>{
    console.log(err);
});

async function main() {
     mongoose.connect(dbUrl);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({extended: true}));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));


const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: process.env.SECRET,
    },
    touchAfter: 24 * 3600,
});

store.on("error", ()=>{
    console.log("Error in MONGO SESSION STORE", err);
})


const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 1000 * 60 * 60 * 24 * 3,
        maxAge: 1000 * 60 * 60 * 24 * 3,
        httpOnly: true
    },
};


// app.get("/", (req, res) => {
//     // res.send("Hi, I am root");
//     res.redirect("/listings");
// });





app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



// --- Review Edit Route button ---

app.get("/listings/:id/reviewedit",(req,res) => {
    res.send("<h2>Delete and add a new Review!</h2>");
    // res.render("/reviewedit");
  });


// --- Google auth ---

app.use("/auth/google", googleRoute);

// GitHub auth

app.use("/auth/github", githubRoute, (req,res) =>{
    res.redirect(`https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}`);
  });


app.use((req,res,next)=>{
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

// app.get("/demouser", async (req,res)=>{
//     let fakeUser = new User({
//         email: "student@gmail.com",
//         username: "student123"
//     });

//     let registeredUser = await User.register(fakeUser, "helloworld");
//     res.send(registeredUser);
// });

app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);

// app.get("/testListing", async (req, res) =>{
//     let sampleListing = new Listing({
//         title: "My New Mansion",
//         description: "By the Sea",
//         price: 12000,
//         location: "Udupi, Karnataka",
//         country: "India",
//     });

//     await sampleListing.save();
//     console.log("sample was saved");
//     res.send("successful testing");
// });

app.all("*", (req, res, next)=>{
    next(new ExpressError(404, "Page Not Found!!"));
});

// app.use((err, req, res, next)=>{
//     let {status=500, message="Something went wrong!"} = err;
//     res.status(status).render("error.ejs", { message });
//     //res.status(status).send(message);
// });

app.use((err, req, res, next) => {
    const { status = 500, message = "Something went wrong" } = err;
    // res.status(status).json({ error: message });
    res.status(status).render("error.ejs", { message });
});


app.listen(8080, () => {
    console.log("server is listening on port 8080");
});