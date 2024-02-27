const mongoose = require("mongoose");

const OrganizerDetailsSchema = new mongoose.Schema({
  address: String,
  postalCode: Number,
  city: String,
  locationName: {
    type: String,
    required: false,
    default: null,
  },
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
  followed: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users", // Reference to the users collection itself
    },
  ],
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
