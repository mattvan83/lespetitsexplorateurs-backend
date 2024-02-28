require("dotenv").config();
const fs = require("fs");
const fetch = require("node-fetch");
const mongoose = require("mongoose");
const faker = require("faker");
const bcrypt = require("bcrypt");
const uid2 = require("uid2"); // Import uid2

process.chdir(__dirname); // Set the current working directory to the script's directory

// Replace with your MongoDB connection string
mongoose.connect(process.env.CONNECTION_STRING, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Replace 'your-api-key' with your OpenCage Geocoding API key
const OPEN_CAGE_API_KEY = "6f20d7cff5224c938e6ad01967cf66f8";

// Models
const User = require("./models/users"); // Adjust the path accordingly
const Activity = require("./models/activities"); // Adjust the path accordingly

// Helper function to generate random coordinates within France
async function getRandomCoordinates() {
  // France coordinates bounding box
  const latMin = 41.33374;
  const latMax = 51.124214;
  const lonMin = -5.55916;
  const lonMax = 9.561794;

  const latitude =
    faker.random.number({ min: latMin * 100000, max: latMax * 100000 }) /
    100000;
  const longitude =
    faker.random.number({ min: lonMin * 100000, max: lonMax * 100000 }) /
    100000;

  try {
    const response = await fetch(
      `https://api.opencagedata.com/geocode/v1/json?key=${OPEN_CAGE_API_KEY}&q=${latitude}+${longitude}&pretty=1`
    );
    const data = await response.json();
    const city = data.results[0]?.components?.city || "Unknown";
    return { latitude, longitude, city };
  } catch (error) {
    console.error("Error fetching city name:", error.message);
    return { latitude, longitude, city: "Unknown" };
  }
}

// Helper function to create an array of random users IDs
async function getRandomIdsUser(model, count, isOrganizer) {
  const documents = await model.find({ isOrganizer });
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
}

// Helper function to create an array of random activities IDs
async function getRandomIdsActivity(model, count) {
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
}

// Hashing function using bcrypt
function hashPassword(password) {
  const saltRounds = 10;
  return bcrypt.hashSync(password, saltRounds);
}

// Asynchronous function to generate sample data
async function generateSampleData() {
  // Generate sample users
  const users = [];
  for (let i = 0; i < 15; i++) {
    const { latitude, longitude, city } = await getRandomCoordinates();

    const isOrganizer = i % 2 === 0; // Every other user is an organizer
    const organizerDetails = isOrganizer
      ? {
          name: faker.company.companyName(),
          function: faker.name.jobTitle(),
          address: faker.address.streetAddress(),
          postalCode: faker.address.zipCode(),
          latitude,
          longitude,
          city,
          followed: await getRandomIdsUser(User, 5, !isOrganizer),
          About: faker.lorem.paragraph(),
          activities: await getRandomIdsActivity(Activity, 5),
        }
      : undefined;

    const hashedPassword = hashPassword(faker.internet.password());
    const token = uid2(32); // Generate a token using uid2

    const user = {
      email: faker.internet.email(),
      username: faker.internet.userName(),
      password: hashedPassword,
      token,
      image: {
        data: Buffer.from("./public/images/user-picture.png"), // Replace with actual image data
        contentType: "image/png",
      },
      followed: isOrganizer
        ? undefined
        : await getRandomIdsUser(User, 5, isOrganizer),
      isOrganizer,
      organizerDetails: isOrganizer ? organizerDetails : undefined,
    };

    users.push(user);
  }

  // Generate sample activities
  const activities = [];
  for (let i = 0; i < 15; i++) {
    const isRecurrent = faker.random.boolean();

    const { latitude, longitude, city } = await getRandomCoordinates();
    const activity = {
      author: await getRandomIdsUser(User, 1, false)[0],
      organizer: await getRandomIdsUser(User, 1, true)[0],
      createdAt: faker.date.past(),
      name: faker.lorem.words(3),
      description: faker.lorem.paragraph(),
      category: faker.random.arrayElement([
        "Sport",
        "Music",
        "Creativity",
        "Motricity",
        "Awakening",
      ]),
      concernedAges: faker.random.arrayElement([
        "3_12months",
        "12_24months",
        "24_36months",
        "3_6years",
        "7_10years",
        "10+years",
      ]),
      address: faker.address.streetAddress(),
      postalCode: faker.address.zipCode(),
      city: "Paris", // Setting city to Paris for all activities
      locationName: faker.company.companyName(),
      latitude,
      longitude,
      city,
      date: faker.date.future(),
      isRecurrent,
      recurrence: isRecurrent
        ? faker.random.arrayElement([
            "Daily",
            "Weekly",
            "Bimonthly",
            "Monthly",
            "Yearly",
          ])
        : undefined,
      image: {
        data: Buffer.from("./public/images/activity.png"), // Replace with actual image data
        contentType: "image/png",
      },
      likes: await getRandomIdsUser(User, 5, false),
    };

    activities.push(activity);
  }

  // Write to JSON files
  fs.writeFileSync("./sampleUsers.json", JSON.stringify(users, null, 2));
  fs.writeFileSync(
    "./sampleActivities.json",
    JSON.stringify(activities, null, 2)
  );

  console.log("Sample JSON data generated successfully.");
}

// Call the asynchronous function to start the generation process
generateSampleData();
