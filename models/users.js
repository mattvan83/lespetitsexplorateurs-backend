const mongoose = require("mongoose");

const getDefaultOrganizerDetails = () => {
  return {
    name: "",
    function: "",
    address: "",
    postalCode: "",
    city: "",
    latitude: 0,
    longitude: 0,
    followed: [],
    About: "",
    activities: [],
  };
};

const OrganizerDetailsSchema = new mongoose.Schema({
  name: String,
  function: String,
  address: String,
  postalCode: String,
  city: String,
  latitude: Number,
  longitude: Number,
  followed: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
  About: String,
  activities: [{ type: mongoose.Schema.Types.ObjectId, ref: "activities" }],
});

const userSchema = mongoose.Schema({
  createdAt: Date,
  email: String,
  username: String,
  password: String,
  token: String,
  image: {
    type: String,
    default: "",
  },
  followed: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
    default: [],
  },
  userPreferences: {
    categories: [
      {
        type: String,
        enum: ["Sport", "Music", "Creativity", "Motricity", "Awakening", ""],
        default: "", // Optional: set a default value
      },
    ],
    concernedAges: [
      {
        type: String,
        enum: [
          "3_12months",
          "12_24months",
          "24_36months",
          "3_6years",
          "7_10years",
          "10+years",
          "",
        ],
        default: "", // Optional: set a default value
      },
    ],
    dates: [
      {
        type: String,
        enum: ["Today", "Tomorrow", "Week", "Month", ""],
        default: "", // Optional: set a default value
      },
    ],
    journeyMoments: [
      {
        type: String,
        enum: ["Morning", "Noon", "Evening", ""],
        default: "",
      },
    ],
    prices: [
      {
        type: String,
        enum: ["Free", "0_10euros", "10+euros", ""],
        default: "",
      },
    ],
    city: {
      type: String,
      default: "",
    },
    radius: {
      type: Number,
      default: 50,
    },
  },
  isOrganizer: {
    type: Boolean,
    required: true,
    default: false,
  },
  organizerDetails: {
    type: OrganizerDetailsSchema,
    default: getDefaultOrganizerDetails,
  },
});

const User = mongoose.model("users", userSchema);

module.exports = User;
