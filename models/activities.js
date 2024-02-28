const mongoose = require("mongoose");

const activitySchema = mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  createdAt: Date,
  name: String,
  description: String,
  category: {
    type: String,
    enum: ["Sport", "Music", "Creativity", "Motricity", "Awakening"],
    required: true,
    // default: "Sport", // Optional: set a default value
  },
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
      required: true,
      // default: "3_12months", // Optional: set a default value
    },
  ],
  address: String,
  postalCode: Number,
  city: String,
  locationName: {
    type: String,
    required: false,
    default: "",
  },
  latitude: Number,
  longitude: Number,
  date: Date,
  isRecurrent: {
    type: Boolean,
    required: true,
    default: false,
  },
  recurrence: {
    type: String,
    enum: ["Daily", "Weekly", "Bimonthly", "Monthly", "Yearly"],
    required: function () {
      return this.isRecurrent; // Make recurrence required only if isRecurrent is true
    },
  },
  image: {
    data: Buffer, // Use Buffer data type to store binary image data
    contentType: String, // Store the content type of the image ('image/jpeg', 'image/png')
  },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
});

const Activity = mongoose.model("activities", activitySchema);

module.exports = Activity;
