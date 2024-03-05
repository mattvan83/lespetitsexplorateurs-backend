var express = require("express");
var router = express.Router();

const { convertCoordsToKm } = require("../modules/computeDistance");

const User = require("../models/users");
const Activity = require("../models/activities");

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

module.exports = router;
