require("dotenv").config();
const fs = require("fs");
const fetch = require("node-fetch");
const faker = require("faker");
const bcrypt = require("bcrypt");
const uid2 = require("uid2"); // Import uid2

process.chdir(__dirname); // Set the current working directory to the script's directory

// Set a basis of 20 locations within a radius of 50 kms from Hauterives/France
const locationsHauterives = [
  {
    city: "Romans-sur-Isère",
    latitude: 45.0434,
    longitude: 5.0505,
    postalCode: "26100",
  },
  {
    city: "Tain-l'Hermitage",
    latitude: 45.0703,
    longitude: 4.8324,
    postalCode: "26600",
  },
  {
    city: "Valence",
    latitude: 44.9333,
    longitude: 4.8924,
    postalCode: "26000",
  },
  {
    city: "Bourg-de-Péage",
    latitude: 45.0362,
    longitude: 5.0556,
    postalCode: "26300",
  },
  {
    city: "Saint-Péray",
    latitude: 44.9308,
    longitude: 4.8481,
    postalCode: "07130",
  },
  {
    city: "Saint-Marcellin",
    latitude: 45.1413,
    longitude: 5.3239,
    postalCode: "38160",
  },
  { city: "Vienne", latitude: 45.5281, longitude: 4.8784, postalCode: "38200" },
  {
    city: "Annonay",
    latitude: 45.2393,
    longitude: 4.6671,
    postalCode: "07100",
  },
  {
    city: "Châteauneuf-sur-Isère",
    latitude: 45.0808,
    longitude: 4.9213,
    postalCode: "26300",
  },
  {
    city: "Loriol-sur-Drôme",
    latitude: 44.7518,
    longitude: 4.8238,
    postalCode: "26270",
  },
  {
    city: "Montélimar",
    latitude: 44.5569,
    longitude: 4.7496,
    postalCode: "26200",
  },
  { city: "Crest", latitude: 44.7284, longitude: 5.0226, postalCode: "26400" },
  {
    city: "Livron-sur-Drôme",
    latitude: 44.7293,
    longitude: 4.8312,
    postalCode: "26250",
  },
  { city: "Die", latitude: 44.7531, longitude: 5.4928, postalCode: "26150" },
  {
    city: "Donzère",
    latitude: 44.4283,
    longitude: 4.7049,
    postalCode: "26290",
  },
  {
    city: "Saint-Rambert-d'Albon",
    latitude: 45.2627,
    longitude: 4.7918,
    postalCode: "26140",
  },
  { city: "Nyons", latitude: 44.3592, longitude: 5.1318, postalCode: "26110" },
  {
    city: "Saint-Vallier",
    latitude: 45.1616,
    longitude: 4.8603,
    postalCode: "26240",
  },
  {
    city: "Pierrelatte",
    latitude: 44.3749,
    longitude: 4.6981,
    postalCode: "26700",
  },
  {
    city: "Le Teil",
    latitude: 44.5504,
    longitude: 4.7039,
    postalCode: "07400",
  },
];

// // Replace 'your-api-key' with your OpenCage Geocoding API key
// const OPEN_CAGE_API_KEY = "6f20d7cff5224c938e6ad01967cf66f8";

// Function to generate a random duration in milliseconds between 15 minutes and 2 hours
function generateRandomDurationInMilliseconds() {
  const hours = faker.random.number({ min: 0, max: 1 }); // Random hours between 0 and 1
  const minutes = faker.random.number({ min: 15, max: 59 }); // Random minutes between 15 and 59

  // Calculate the total duration in milliseconds
  return (hours * 60 + minutes) * 60 * 1000;
}

// Helper function to generate random coordinates within France
async function getRandomCoordinates() {
  // // France coordinates bounding box
  // const latMin = 41.33374;
  // const latMax = 51.124214;
  // const lonMin = -5.55916;
  // const lonMax = 9.561794;

  // const latitude =
  //   faker.random.number({ min: latMin * 100000, max: latMax * 100000 }) /
  //   100000;
  // const longitude =
  //   faker.random.number({ min: lonMin * 100000, max: lonMax * 100000 }) /
  //   100000;

  // Coordinates of Hauterives, France
  const hauterivesLatitude = 45.2546;
  const hauterivesLongitude = 5.0274;

  // Radius in kilometers
  const radius = 50;

  // Convert radius to degrees (1 degree is approximately 111 kilometers)
  const radiusInDegrees = radius / 111;

  // Generate random coordinates within the specified radius
  const latitude =
    hauterivesLatitude +
    faker.random.number({ min: -radiusInDegrees, max: radiusInDegrees });
  const longitude =
    hauterivesLongitude +
    faker.random.number({ min: -radiusInDegrees, max: radiusInDegrees });

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

// Hashing function using bcrypt
function hashPassword(password) {
  const saltRounds = 10;
  return bcrypt.hashSync(password, saltRounds);
}

// Asynchronous function to generate sample data
async function generateSampleData() {
  // Generate sample users
  const users = [];
  for (let i = 0; i < 20; i++) {
    // const { latitude, longitude, city } = await getRandomCoordinates();
    const { latitude, longitude, postalCode, city } =
      faker.random.arrayElement(locationsHauterives);

    const isOrganizer = i % 2 === 0; // Every other user is an organizer
    const organizerDetails = isOrganizer
      ? {
          name: faker.company.companyName(),
          function: faker.name.jobTitle(),
          address: faker.address.streetAddress(),
          postalCode,
          latitude,
          longitude,
          city,
          followed: [],
          About: faker.lorem.paragraph(),
          activities: [],
        }
      : {
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

    const hashedPassword = hashPassword(faker.internet.password());
    const token = uid2(32); // Generate a token using uid2

    const user = {
      createdAt: faker.date.past(),
      email: faker.internet.email(),
      username: faker.internet.userName(),
      password: hashedPassword,
      token,
      image: faker.random.arrayElement([
        "../assets/test/profil1.png",
        "../assets/test/profil2.png",
      ]),
      followed: [],
      userPreferences: {
        categories: "",
        concernedAges: [],
        dates: [],
        journeyMoments: [],
        prices: [],
        city: "",
        radius: 50,
      },
      isOrganizer,
      organizerDetails: organizerDetails,
    };

    users.push(user);
  }

  // Generate sample activities
  const activities = [];
  for (let i = 0; i < 20; i++) {
    const isRecurrent = faker.random.boolean();

    // const { latitude, longitude, city } = await getRandomCoordinates();
    const { latitude, longitude, postalCode, city } =
      faker.random.arrayElement(locationsHauterives);

    const activity = {
      author: "",
      organizer: "",
      createdAt: faker.date.past(),
      name: faker.lorem.words(3),
      description: faker.lorem.paragraph(),
      durationInMilliseconds: generateRandomDurationInMilliseconds(),
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
      postalCode,
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
      image: faker.random.arrayElement([
        "../assets/test/activity1.png",
        "../assets/test/activity2.png",
        "../assets/test/activity3.png",
      ]),
      likes: [],
    };

    activities.push(activity);
  }

  // Write to JSON files
  fs.writeFileSync("./test/sampleUsers.json", JSON.stringify(users, null, 2));
  fs.writeFileSync(
    "./test/sampleActivities.json",
    JSON.stringify(activities, null, 2)
  );

  console.log("Sample JSON data generated successfully.");
}

// Call the asynchronous function to start the generation process
generateSampleData();
