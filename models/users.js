const mongoose = require("mongoose");

const getDefaultUserPreferences = () => {
  return {
    categories: [],
    concernedAges: [],
    dates: [],
    journeyMoments: [],
    priceMax: 50,
    city: "",
    latitude: -200,
    longitude: -200,
    radius: 50,
  };
};

const UserPreferencesSchema = new mongoose.Schema({
  categories: [String],
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
      ],
    },
  ],
  dates: [
    {
      type: String,
      enum: ["Today", "Tomorrow", "Week", "Month"],
    },
  ],
  journeyMoments: [
    {
      type: String,
      enum: ["Morning", "Noon", "Evening"],
    },
  ],
  priceMax: Number,
  city: String,
  latitude: Number,
  longitude: Number,
  radius: Number,
});

const getDefaultOrganizerDetails = () => {
  return {
    name: "",
    function: "",
    address: "",
    postalCode: "",
    city: "",
    latitude: -200,
    longitude: -200,
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
  followedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
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
  followedBy: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
    default: [],
  },
  userPreferences: {
    type: UserPreferencesSchema,
    default: getDefaultUserPreferences,
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
