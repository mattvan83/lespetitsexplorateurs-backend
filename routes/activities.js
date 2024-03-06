var express = require("express");
var router = express.Router();

const { convertCoordsToKm } = require("../modules/computeDistance");
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
  if (!checkBody(req.body, ["token", "latitude", "longitude"])) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  User.findOne({ token: req.body.token }).then((data) => {
    if (data) {
      // Get user ID and maximum radius of search (in kms) from user preferences
      const userId = data._id;
      // const userPreferenceRadius = 630;

      // Get filters set by the user and clean these filters to useful fields
      const userFilters = req.body.filters;
      const userFiltersCleanedKeys = Object.keys(userFilters).filter(
        (key) =>
          !userFilters[key] &&
          (!Array.isArray(myObject[key]) || userFilters[key].length)
      );

      // Reconstruct a cleaned filters object
      const userFiltersCleaned = {};
      userFiltersCleanedKeys.forEach((key) => {
        userFiltersCleaned[key] = userFilters[key];
      });

      // Mapping between frontend and backend categories
      if (userFiltersCleaned.categoryFilter.length) {
        userFiltersCleaned.categoryFilter =
          userFiltersCleaned.categoryFilter.map(
            (category) => categoryMapping[category]
          );
      }

      // Mapping between frontend and backend age
      if (userFiltersCleaned.ageFilter.length) {
        userFiltersCleaned.ageFilter = userFiltersCleaned.ageFilter.map(
          (age) => ageMapping[age]
        );
      }

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

module.exports = router;
