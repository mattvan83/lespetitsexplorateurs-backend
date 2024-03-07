var express = require("express");
var router = express.Router();

const { convertCoordsToKm } = require("../modules/computeDistance");
const {
  determineDateBoundaries,
  determineTargetHours,
} = require("../modules/determineDateBoundaries");
const { checkBody } = require("../modules/checkBody");

const User = require("../models/users");
const Activity = require("../models/activities");

const dateFilters = ["Aujourd'hui", "Demain", "Cette semaine", "Ce week-end"];
const momentFilters = ["Matin", "Après-midi", "Soir"];

const categoryMapping = {
  Sport: "Sport",
  Musique: "Music",
  Créativité: "Creativity",
  Motricité: "Motricity",
  Éveil: "Awakening",
};

const ageMapping = {
  "3-12 mois": "3_12months",
  "1-3 ans": "1_3years",
  "3-6 ans": "3_6years",
  "6-10 ans": "6_10years",
  "10+ ans": "10+years",
};

const dateMapping = {
  "Aujourd'hui": "Today",
  Demain: "Tomorrow",
  "Cette semaine": "Week",
  "Ce week-end": "Weekend",
};

const momentMapping = {
  Matin: "Morning",
  "Après-midi": "Afternoon",
  Soir: "Evening",
};

router.get("/nogeoloc/:token", (req, res) => {
  User.findOne({ token: req.params.token }).then((data) => {
    if (data) {
      // Get user ID
      const userId = data._id;

      // Collect all activities sorted by increasing date of happening.
      // The number of these activities is limited to a maximum of 15.
      Activity.find()
        .populate("organizer")
        .then((activities) => {
          if (activities.length) {
            const activitiesMapped = activities
              .map((activity) => {
                return {
                  id: activity._id,
                  imgUrl: activity.image,
                  organizer: activity.organizer.organizerDetails.name,
                  organizerImgUrl: activity.organizer.image,
                  date: activity.date,
                  name: activity.name,
                  postalCode: activity.postalCode,
                  city: activity.city,
                  isLiked: activity.likes.includes(userId),
                };
              })
              .sort((a, b) => a.date - b.date);

            if (activitiesMapped.length > 15) {
              res.json({
                result: true,
                activities: activitiesMapped.slice(0, 15),
              });
            } else {
              res.json({
                result: true,
                activities: activitiesMapped,
              });
            }
          } else {
            res.json({
              result: false,
              error: "No activity found in database",
            });
          }
        });
    } else {
      res.json({ result: false, error: "User not found" });
    }
  });
});

router.post("/geoloc", (req, res) => {
  if (!checkBody(req.body, ["token", "latitude", "longitude", "scope"])) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  User.findOne({ token: req.body.token }).then((data) => {
    if (data) {
      // Get user ID
      const userId = data._id;

      // Get filters set by the user and clean these filters to useful fields
      const userFilters = req.body.filters;
      const userFiltersCleanedKeys = Object.keys(userFilters).filter(
        (key) =>
          userFilters[key] &&
          (!Array.isArray(userFilters[key]) || userFilters[key].length)
      );

      // Reconstruct a cleaned filters object
      const userFiltersCleaned = {};
      userFiltersCleanedKeys.forEach((key) => {
        userFiltersCleaned[key] = userFilters[key];
      });
      console.log("userFiltersCleaned: ", userFiltersCleaned);

      const findFilters = {};
      if (userFilters) {
        // Mapping between frontend and backend categories
        if (userFiltersCleaned.categoryFilter) {
          userFiltersCleaned.categoryFilter =
            userFiltersCleaned.categoryFilter.map(
              (category) => categoryMapping[category]
            );
        }

        // Mapping between frontend and backend age
        if (userFiltersCleaned.ageFilter) {
          userFiltersCleaned.ageFilter = userFiltersCleaned.ageFilter.map(
            (age) => ageMapping[age]
          );
        }

        // Mapping between frontend and backend date
        if (userFiltersCleaned.dateFilter) {
          userFiltersCleaned.dateFilter = userFiltersCleaned.dateFilter.map(
            (date) => dateMapping[date]
          );
        }

        // Mapping between frontend and backend moment
        if (userFiltersCleaned.momentFilter) {
          userFiltersCleaned.momentFilter = userFiltersCleaned.momentFilter.map(
            (moment) => momentMapping[moment]
          );
        }
        console.log("userFiltersCleanedMapping: ", userFiltersCleaned);

        // Build the dynamic filtering parameters for following mongoose find on activities
        Object.keys(userFiltersCleaned).forEach((key) => {
          if (key === "categoryFilter") {
            findFilters.category = { $in: userFiltersCleaned[key] };
          } else if (key === "ageFilter") {
            findFilters.concernedAges = {
              $in: userFiltersCleaned[key],
            };
          } else if (key === "priceFilter") {
            findFilters.price = { $lte: userFiltersCleaned[key] };
          } else if (key === "dateFilter") {
            const dateBoundaries = determineDateBoundaries(
              userFiltersCleaned[key]
            );
            console.log("dateBoundaries: ", dateBoundaries);
            if (dateBoundaries.length === 1) {
              findFilters.date = {
                $gte: dateBoundaries[0][0],
                $lte: dateBoundaries[0][1],
              };
            } else if (dateBoundaries.length === 2) {
              findFilters.$or = [
                {
                  date: {
                    $gte: dateBoundaries[0][0],
                    $lte: dateBoundaries[0][1],
                  },
                },
                {
                  date: {
                    $gte: dateBoundaries[1][0],
                    $lte: dateBoundaries[1][1],
                  },
                },
              ];
            }
          }
        });
      }
      console.log("findFilters: ", findFilters);

      // Collect all activities sorted by increasing distance from the user location.
      // These activities distances are below than or equal to the user's maximum radius of search.
      Activity.find(findFilters)
        .populate("organizer")
        .then((activities) => {
          if (activities.length) {
            const activitiesMapped = activities.map((activity) => {
              return {
                id: activity._id,
                imgUrl: activity.image,
                organizer: activity.organizer.organizerDetails.name,
                organizerImgUrl: activity.organizer.image,
                date: activity.date,
                name: activity.name,
                postalCode: activity.postalCode,
                city: activity.city,
                isLiked: activity.likes.includes(userId),
                distance: convertCoordsToKm(
                  {
                    latitude: req.body.latitude,
                    longitude: req.body.longitude,
                  },
                  {
                    latitude: activity.latitude,
                    longitude: activity.longitude,
                  }
                ),
              };
            });

            const activitiesFiltered = activitiesMapped.filter((activity) => {
              if (userFiltersCleaned.momentFilter) {
                const targetHours = determineTargetHours(
                  userFiltersCleaned.momentFilter
                );
                const activityHour = activity.date.getHours();

                if (targetHours.length === 1) {
                  return (
                    activity.distance <= req.body.scope &&
                    activityHour >= targetHours[0][0] &&
                    activityHour < targetHours[0][1]
                  );
                } else if (targetHours.length === 2) {
                  return (
                    activity.distance <= req.body.scope &&
                    ((activityHour >= targetHours[0][0] &&
                      activityHour < targetHours[0][1]) ||
                      (activityHour >= targetHours[1][0] &&
                        activityHour < targetHours[1][1]))
                  );
                }
              } else {
                return activity.distance <= req.body.scope;
              }
            });

            if (activitiesFiltered.length) {
              res.json({
                result: true,
                activities: activitiesFiltered.sort(
                  (a, b) => a.distance - b.distance
                ),
              });
            } else {
              res.json({
                result: false,
                error: `No activity found at less than ${req.body.scope} kms`,
              });
            }
          } else {
            res.json({
              result: false,
              error: "No activity found in database",
            });
          }
        });
    } else {
      res.json({ result: false, error: "User not found" });
    }
  });
});

router.get("/geoloc/:token/:latitude/:longitude", (req, res) => {
  User.findOne({ token: req.params.token }).then((data) => {
    if (data) {
      // Get user ID and maximum radius of search (in kms) from user preferences
      const userId = data._id;
      //   const userPreferenceRadius = data.userPreferences.radius;
      const userPreferenceRadius = 630;

      // Collect all activities sorted by increasing distance from the user location.
      // These activities distances are below than or equal to the user's maximum radius of search.
      Activity.find()
        .populate("organizer")
        .then((activities) => {
          if (activities.length) {
            const activitiesMapped = activities.map((activity) => {
              return {
                id: activity._id,
                imgUrl: activity.image,
                organizer: activity.organizer.organizerDetails.name,
                organizerImgUrl: activity.organizer.image,
                date: activity.date,
                name: activity.name,
                postalCode: activity.postalCode,
                city: activity.city,
                isLiked: activity.likes.includes(userId),
                distance: convertCoordsToKm(
                  {
                    latitude: req.params.latitude,
                    longitude: req.params.longitude,
                  },
                  {
                    latitude: activity.latitude,
                    longitude: activity.longitude,
                  }
                ),
              };
            });

            const activitiesFiltered = activitiesMapped.filter(
              (activity) => activity.distance <= userPreferenceRadius
            );

            if (activitiesFiltered.length) {
              res.json({
                result: true,
                activities: activitiesFiltered.sort(
                  (a, b) => a.distance - b.distance
                ),
              });
            } else {
              res.json({
                result: false,
                error: `No activity found at less than ${userPreferenceRadius} kms`,
              });
            }
          } else {
            res.json({
              result: false,
              error: "No activity found in database",
            });
          }
        });
    } else {
      res.json({ result: false, error: "User not found" });
    }
  });
});

//Get the activity informations for the ActivitySheet
router.get("/:id", (req, res) => {
  const activityId = req.params.id;

  Activity.findById(activityId).then((activity) => {
    if (activity) {
      res.json({
        organizer: activity.organizer,
        name: activity.name,
        description: activity.description,
        address: activity.address,
        postalCode: activity.postalCode,
        city: activity.city,
        locationName: activity.locationName,
        date: activity.date,
        duration: activity.durationInMilliseconds,
        image: activity.image,
      });
    } else {
      res.json({ error: "Activity not found" });
    }
  });
});

// GET all the activities of the user
router.get("/allactivities/:token", (req, res) => {
  User.findOne({ token: req.params.token }).then((data) => {
    if (data) {
      const userId = data._id;
      // Collect all activities of the user sorted by increasing date of happening.
      Activity.find({ author: userId})
        .populate("organizer")
        .then((activities) => {
          if (activities.length) {
            const activitiesMapped = activities.map((activity) => {
                return {
                  id: activity._id,
                  imgUrl: activity.image,
                  organizer: activity.organizer.organizerDetails.name,
                  organizerImgUrl: activity.organizer.image,
                  date: activity.date,
                  name: activity.name,
                  postalCode: activity.postalCode,
                  city: activity.city,
                  isLiked: activity.likes.includes(userId),
                };
              })
              .sort((a, b) => a.date - b.date);

             res.json({ result: true, activities: activitiesMapped});
          } else {
            res.json({ result: false, error: "No activity found in database",
            });
          }
        });
    } else {
      res.json({ result: false, error: "User not found" });
    }
  });
});

// DELETE an activity
router.delete('/', (req, res) => {
  if (!checkBody(req.body, ['token', 'activityId'])) {
    res.json({ result: false, error: 'Missing or empty fields' });
    return;
  }

  User.findOne({ token: req.body.token }).then(user => {
    if (user === null) {
      res.json({ result: false, error: 'User not found' });
      return;
    }

    Activity.findById(req.body.activityId)
      .populate('author')
      .then(activity => {
        if (!activity) {
          res.json({ result: false, error: 'Activity not found' });
          return;
        } else if (String(activity.author._id) !== String(user._id)) { // ObjectId needs to be converted to string (JavaScript cannot compare two objects)
          res.json({ result: false, error: 'Activity can only be deleted by its author' });
          return;
        }

        Activity.deleteOne({ _id: activity._id }).then(() => {
          res.json({ result: true });
        });
      });
  });
});

  //Create a new activity - POST
  router.post("/newActivity", (req, res) => {
    const requiredFields = ['name', 'description', 'category', 'address', 'date'];
    if (!checkBody(req.body, requiredFields)) {
          res.json({ result: false, error: "Missing or empty fields" });
          return;
        }
        //id from fake bd:
        //const userId = ObjectId('65e8350c87ae8d56cbb63ef1');
        //const organizerId = ObjectId('65e77185e8a90dd96d5b27a1');
        const createdAt = new Date();
  
        const newActivity = new Activity({
          //author: userId,
          //organizerId,
          createdAt,
          name: req.body.name,
          description: req.body.description,
          durationInMilliseconds: req.body.duration,
          category: req.body.category,
          concernedAges: req.body.concernedAges,
          address: req.body.address,
          postalCode: req.body.postalCode,
          locationName: req.body.locationName,
          latitude: req.body.latitude,
          longitude: req.body.longitude,
          city: req.body.city,
          date: req.body.date,
          isRecurrent: req.body.isRecurrent,
          recurrence: req.body.recurrence,
          image: req.body.image,
        });
  
        newActivity.save().then((activity) => {
          if (activity) {
            res.json({
              result: true,
              activity,
            });
          } else {
            res.json({
              result: false,
              error: "New activity failed to be registered",
            });
          }
        });
  });

module.exports = router;
