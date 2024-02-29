require("dotenv").config();
const mongoose = require("mongoose");

process.chdir(__dirname); // Set the current working directory to the script's directory

const shuffleArray = (array) => {
  // Fisher-Yates shuffle algorithm
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
};

// Helper function to create an array of random users IDs
const getRandomIdsUser = async (model, count, isOrganizer) => {
  const documents = await model.find({ isOrganizer });
  // console.log("documents: ", documents);

  // Shuffle the array of documents
  shuffleArray(documents);

  const ids = [];

  for (let i = 0; i < count && i < documents.length; i++) {
    const randomDocument = documents[i];
    ids.push(randomDocument._id);
  }

  return ids;
};

// Helper function to create an array of random activities IDs
const getRandomIdsActivity = async (model, count) => {
  const documents = await model.find();
  const ids = [];

  for (let i = 0; i < count; i++) {
    const randomDocument =
      documents.length > 0
        ? documents[Math.floor(Math.random() * documents.length)]
        : null;
    if (randomDocument) {
      ids.push(randomDocument._id);
    }
  }

  return ids;
};

// Asynchronous function to generate sample data
async function UpdateActivityUserDB() {
  // Replace with your MongoDB connection string
  await mongoose
    .connect(process.env.CONNECTION_STRING, { connectTimeoutMS: 2000 })
    .then(() => {
      console.log("Database connected");
    });

  // Models
  const User = require("./models/users"); // Adjust the path accordingly
  const Activity = require("./models/activities"); // Adjust the path accordingly

  const activities = await Activity.find();

  for (const activity of activities) {
    const idAuthor = (await getRandomIdsUser(User, 1, false))[0];
    const idOrganizer = (await getRandomIdsUser(User, 1, true))[0];
    const idUsersLikes = await getRandomIdsUser(User, 3, false);
    // console.log(idAuthor, idOrganizer, idUsersLikes);

    activity.author = idAuthor;
    activity.organizer = idOrganizer;
    activity.likes = idUsersLikes;

    await activity
      .save()
      .then(console.log("Successful update of the activity"));

    const organizer = await User.findById(idOrganizer);
    // console.log(organizer);

    organizer.organizerDetails.activities.push(activity._id);
    if (organizer.organizerDetails.followed.length === 0) {
      const idUsersFollows = await getRandomIdsUser(User, 4, false);
      organizer.organizerDetails.followed = idUsersFollows;
      await organizer
        .save()
        .then(console.log("Successful update of the organizer"));
    }
  }
  const users = await User.find({ isOrganizer: false });
  for (const user of users) {
    const idUsersFollows = await getRandomIdsUser(User, 5, false);
    user.followed = idUsersFollows;
    await user.save().then(console.log("Successful update of the parent"));
  }
}

UpdateActivityUserDB();
