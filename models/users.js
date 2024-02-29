const mongoose = require("mongoose");

const OrganizerDetailsSchema = new mongoose.Schema({
  name: String,
  function: String,
  address: String,
  postalCode: Number,
  city: String,
  latitude: Number,
  longitude: Number,
  followed: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users", // Reference to the users collection itself
    },
  ],
  About: String,
  activities: [{ type: mongoose.Schema.Types.ObjectId, ref: "activities" }],
});

const userSchema = mongoose.Schema({
  email: String,
  username: String,
  password: String,
  token: String,
  image: {
    type: String,
    required: false,
  },
  followed: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
    required: function () {
      return !this.isOrganizer; // Make parent following required only if isOrganizer is false
    },
  },
  isOrganizer: {
    type: Boolean,
    required: true,
    default: false,
  },
  organizerDetails: {
    type: OrganizerDetailsSchema,
    required: function () {
      return this.isOrganizer; // Make organizerDetails required only if isOrganizer is true
    },
  },
});

const User = mongoose.model("users", userSchema);

module.exports = User;
