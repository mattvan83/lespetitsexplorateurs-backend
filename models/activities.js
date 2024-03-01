const mongoose = require("mongoose");

const activitySchema = mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  createdAt: Date,
  name: String,
  description: String,
  durationInMilliseconds: {
    type: Number,
    default: 0,
  },
  category: {
    type: String,
    enum: ["Sport", "Music", "Creativity", "Motricity", "Awakening", ""],
    default: "", // Optional: set a default value
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
        "",
      ],
      default: "", // Optional: set a default value
    },
  ],
  address: String,
  postalCode: String,
  city: String,
  latitude: Number,
  longitude: Number,
  locationName: {
    type: String,
    default: "",
  },
  date: Date,
  isRecurrent: {
    type: Boolean,
    required: true,
    default: false,
  },
  recurrence: {
    type: String,
    enum: ["Daily", "Weekly", "Bimonthly", "Monthly", "Yearly", ""],
    default: "",
  },
  image: {
    type: String,
    default: "",
  },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
});

const Activity = mongoose.model("activities", activitySchema);

module.exports = Activity;
