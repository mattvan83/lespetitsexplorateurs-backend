require("dotenv").config();
const mongoose = require("mongoose");
const moment = require("moment");
const Activity = require("./models/activities"); // Adjust the path accordingly

process.chdir(__dirname); // Set the current working directory to the script's directory

// Function to add one month to a date using moment.js
function addOneMonth(date) {
  return moment(date).add(1, "months").toDate();
}

// Asynchronous function to update activities dates
async function UpdateActivityDatesDB() {
  // Replace with your MongoDB connection string
  await mongoose
    .connect(process.env.CONNECTION_STRING, { connectTimeoutMS: 2000 })
    .then(() => {
      console.log("Database connected");
    });

  // Update all documents by adding one month to the 'myDateField'
  Activity.find({})
    .then((docs) => {
      docs.forEach((doc) => {
        const newDate = addOneMonth(doc.date);
        Activity.updateOne(
          { _id: doc._id },
          { $set: { date: newDate } }
        ).exec();
      });
    })
    .then(() => {
      console.log("All documents updated successfully");
    })
    .catch((err) => {
      console.error("Error updating documents:", err);
    });
}

UpdateActivityDatesDB();
