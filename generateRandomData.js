require("dotenv").config();
const fs = require("fs");
const fetch = require("node-fetch");
const faker = require("faker");
const bcrypt = require("bcrypt");
const uid2 = require("uid2"); // Import uid2
const locationsHauterives = require("./test/sampleCities.json");

// console.log(locationsHauterives);

process.chdir(__dirname); // Set the current working directory to the script's directory

const activityExamples = [
  {
    imgUrl:
      "https://res.cloudinary.com/ddoqxafok/image/upload/v1709806689/ayhd0t2zcvyjw9walrxd.jpg",
    activityName: "Bébés nageurs",
    activityCategory: "Sport",
  },
  {
    imgUrl:
      "https://res.cloudinary.com/ddoqxafok/image/upload/v1709806689/nov76kiuz5sovyknrbss.jpg",
    activityName: "Motricité",
    activityCategory: "Motricity",
  },
  {
    imgUrl:
      "https://res.cloudinary.com/ddoqxafok/image/upload/v1709806690/rvoaagsmc1azgnpyug6a.jpg",
    activityName: "Ludothèque",
    activityCategory: "Creativity",
  },
  {
    imgUrl:
      "https://res.cloudinary.com/ddoqxafok/image/upload/v1709806690/yzymzwsdqzn2ua8juorw.jpg",
    activityName: "Motricité",
    activityCategory: "Motricity",
  },
  {
    imgUrl:
      "https://res.cloudinary.com/ddoqxafok/image/upload/v1709806690/j2zemzydabou06lvpveq.png",
    activityName: "Ukubébé",
    activityCategory: "Music",
  },
  {
    imgUrl:
      "https://res.cloudinary.com/ddoqxafok/image/upload/v1709806691/gurdmmxecu7ndfczjzpl.jpg",
    activityName: "Atelier portage",
    activityCategory: "Awakening",
  },
  {
    imgUrl:
      "https://res.cloudinary.com/ddoqxafok/image/upload/v1709806691/yzbuvpyayuvkdz0sbkhc.png",
    activityName: "Éveil muscial",
    activityCategory: "Awakening",
  },
];

const organizersExamples = [
  {
    imgUrl:
      "https://res.cloudinary.com/ddoqxafok/image/upload/v1709806863/sl7oapoozkmcwoskbud9.png",
    organizerName: "Le Cerf Volant",
  },
  {
    imgUrl:
      "https://res.cloudinary.com/ddoqxafok/image/upload/v1709806863/fwhd7vfta7guht7ilmwu.jpg",
    organizerName: "Presque Pieds Nus",
  },
  {
    imgUrl:
      "https://res.cloudinary.com/ddoqxafok/image/upload/v1710250433/q9uvokvuwjmq1zr61vsn.png",
    organizerName: "Les Enfants d'Abord",
  },
  {
    imgUrl:
      "https://res.cloudinary.com/ddoqxafok/image/upload/v1710250433/m7lpzwpirb9rx4rv8kmd.png",
    organizerName: "A.P.E.L.B",
  },
  {
    imgUrl:
      "https://res.cloudinary.com/ddoqxafok/image/upload/v1710250433/cutu4dn9eknmhpqigcvd.jpg",
    organizerName: "APE",
  },
  {
    imgUrl:
      "https://res.cloudinary.com/ddoqxafok/image/upload/v1710250433/hwoxritsynaxhc9ovurz.webp",
    organizerName: "Les Minimômes",
  },
  {
    imgUrl: "",
    organizerName: "SOU de St Donat",
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

function generateFutureDate() {
  const delay = 15;
  const currentDate = new Date();
  const futureDate = faker.date.between(
    currentDate,
    new Date(currentDate.getTime() + delay * 24 * 60 * 60 * 1000)
  );
  return futureDate;
}

function generatePastDate() {
  const delay = 30;
  const currentDate = new Date();
  const pastDate = faker.date.between(
    new Date(currentDate.getTime() - delay * 24 * 60 * 60 * 1000),
    currentDate
  );
  return pastDate;
}

function generateRandomSublist(list, maxSize) {
  const shuffledList = faker.helpers.shuffle(list);
  const sublistSize = faker.random.number({
    min: 1,
    max: Math.min(maxSize, shuffledList.length),
  });
  const sublist = shuffledList.slice(0, sublistSize);
  return sublist;
}

// Asynchronous function to generate sample data
async function generateSampleData() {
  // Generate sample users
  const users = [];
  for (let i = 0; i < 20; i++) {
    // const { latitude, longitude, city } = await getRandomCoordinates();
    // const { latitude, longitude, postalCode, city } =
    //   faker.random.arrayElement(locationsHauterives);
    const location = {
      latitude: locationsHauterives[i].coords[1],
      longitude: locationsHauterives[i].coords[0],
      postalCode: locationsHauterives[i].postalCode,
      city: locationsHauterives[i].cityName,
    };

    const exampleOrganizer = faker.random.arrayElement(organizersExamples);

    const userPreferences = {
      concernedAges: [],
      city: "",
      latitude: -200,
      longitude: -200,
      radius: 50,
    };

    const isOrganizer = i % 2 === 0; // Every other user is an organizer
    const organizerDetails = isOrganizer
      ? {
          name: exampleOrganizer.organizerName,
          title: faker.name.jobTitle(),
          address: faker.address.streetAddress(),
          postalCode: location.postalCode,
          latitude: location.latitude,
          longitude: location.longitude,
          city: location.city,
          followedBy: [],
          about: faker.lorem.paragraph(),
          activities: [],
        }
      : {
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

    const hashedPassword = hashPassword(faker.internet.password());
    const token = uid2(32); // Generate a token using uid2

    const user = {
      createdAt: generatePastDate(),
      email: faker.internet.email(),
      username: faker.internet.userName(),
      password: hashedPassword,
      token,
      imgUrl: isOrganizer ? exampleOrganizer.imgUrl : "",
      followedBy: [],
      userPreferences: userPreferences,
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
    // const { latitude, longitude, postalCode, city } =
    //   faker.random.arrayElement(locationsHauterives);
    const location = {
      latitude: locationsHauterives[i].coords[1],
      longitude: locationsHauterives[i].coords[0],
      postalCode: locationsHauterives[i].postalCode,
      city: locationsHauterives[i].cityName,
    };

    const exampleActivity = faker.random.arrayElement(activityExamples);

    const activity = {
      author: "",
      organizer: "",
      createdAt: generatePastDate(),
      name: exampleActivity.activityName,
      description: faker.lorem.paragraph(),
      durationInMilliseconds: generateRandomDurationInMilliseconds(),
      category: exampleActivity.activityCategory,
      concernedAges: generateRandomSublist(
        ["3_12months", "1_3years", "3_6years", "6_10years", "10+years"],
        3
      ),
      address: faker.address.streetAddress(),
      postalCode: location.postalCode,
      locationName: faker.company.companyName(),
      latitude: location.latitude,
      longitude: location.longitude,
      city: location.city,
      date: generateFutureDate(),
      isRecurrent,
      recurrence: faker.random.arrayElement([
        "Daily",
        "Weekly",
        "Bimonthly",
        "Monthly",
        "Yearly",
      ]),
      imgUrl: exampleActivity.imgUrl,
      likes: [],
      price: faker.random.number({ min: 0, max: 50 }),
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
