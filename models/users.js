const mongoose = require("mongoose");

const getDefaultUserPreferences = () => {
  return {
    concernedAges: [],
    city: "",
    latitude: -200,
    longitude: -200,
    radius: 50,
  };
};

const UserPreferencesSchema = new mongoose.Schema({
  concernedAges: [
    {
      type: String,
      enum: ["3_12months", "1_3years", "3_6years", "6_10years", "10+years"],
    },
  ],
  city: String,
  latitude: Number,
  longitude: Number,
  radius: Number,
});

const getDefaultOrganizerDetails = () => {
  return {
    name: "",
    title: "",
    address: "",
    postalCode: "",
    city: "",
    latitude: -200,
    longitude: -200,
    followed: [],
    about: "",
    activities: [],
  };
};

const OrganizerDetailsSchema = new mongoose.Schema({
  name: String,
  title: String,
  address: String,
  postalCode: String,
  city: String,
  latitude: Number,
  longitude: Number,
  followedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
  about: String,
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
