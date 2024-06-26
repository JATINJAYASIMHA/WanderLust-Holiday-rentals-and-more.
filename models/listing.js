const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./reviews");

// const imageSchema = new Schema({
//     filename: {
//         type: String,
//         default: "defaultimage",
//     },
//     url: {
//         type: String,
//         default: "https://images.unsplash.com/photo-1715558666340-f47008461cf3?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
//         set: (v) => v === "" ? "https://images.unsplash.com/photo-1715558666340-f47008461cf3?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D": v,
//     }
// });

const listingSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    description: String,
    image: {
        url: String,
        filename: String,
    },
        
    price: Number,
    location: String,
    country: String,
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: "Review",
        }
    ],
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    
    geometry: {
        type: {
            type: String,
            enum: ['Point'],
            required: true,
        },
        coordinates: {
            type: [Number],
            required: true
        },
    },

    category: {
        type: [String],
      },
    
});

listingSchema.post("findOneAndDelete", async (listing) => {
    if(listing) {
        await Review.deleteMany({_id : {$in: listing.reviews}});
     }
    
});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing; 