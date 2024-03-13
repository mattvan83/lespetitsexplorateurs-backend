var express = require("express");
var router = express.Router();

const User = require("../models/users");
const { convertCoordsToKm } = require("../modules/computeDistance");
const { checkBody } = require("../modules/checkBody");

// GET organizer by Id
router.get("/byId/:id/:longitude/:latitude", (req, res) => {
  User.findById(req.params.id)
    .populate("organizerDetails.activities")
    .then((data) => {
      if (data) {
        console.log(data);
        const organizer = {
          id: data._id,
          imgUrl: data.imgUrl,
          name: data.organizerDetails.name,
          title: data.organizerDetails.title,
          about: data.organizerDetails.about,
          activities: data.organizerDetails.activities,
        };
        res.json({ result: true, organizer: organizer });
      } else {
        res.json({ result: false, error: "No results" });
      }
    });
});

// GET all organizers if no geolocalisation data available
router.get("/nogeoloc", (req, res) => {
  User.find({ isOrganizer: true })
    .populate("organizerDetails.activities")
    // .select(
    //   "_id imgUrl organizerDetails.name organizerDetails.title organizerDetails.about organizerDetails.activities"
    // )
    .then((data) => {
      if (data.length) {
        const organizers = data
          .map((organizer) => {
            return {
              id: organizer._id,
              imgUrl: organizer.imgUrl,
              name: organizer.organizerDetails.name,
              title: organizer.organizerDetails.title,
              about: organizer.organizerDetails.about,
              activities: organizer.organizerDetails.activities,
              createdAt: organizer.createdAt,
            };
          })
          .sort((a, b) => b.createdAt - a.createdAt);
        res.json({ result: true, organizers: organizers });
      } else {
        res.json({
          result: false,
          error: "Aucun organisateur trouvé dans la base de données",
        });
      }
    });
});

router.get("/geoloc/:preferenceRadius/:longitude/:latitude", (req, res) => {
  // We get the preferenceRadius from the Redux store
  if (!checkBody(req.params, ["preferenceRadius", "latitude", "longitude"])) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  User.find({ isOrganizer: true })
    .populate("organizerDetails.activities")
    // .select('_id imgUrl organizerDetails.name organizerDetails.title organizerDetails.about organizerDetails.activities organizerDetails.longitude organizerDetails.latitude')
    .then((data) => {
      if (data.length) {
        const organizers = data.map((organizer) => {
          return {
            id: organizer._id,
            imgUrl: organizer.imgUrl,
            name: organizer.organizerDetails.name,
            title: organizer.organizerDetails.title,
            about: organizer.organizerDetails.about,
            activities: organizer.organizerDetails.activities,
            longitude: organizer.organizerDetails.longitude,
            latitude: organizer.organizerDetails.latitude,
            distance: convertCoordsToKm(
              {
                latitude: req.params.latitude,
                longitude: req.params.longitude,
              },
              {
                latitude: organizer.organizerDetails.latitude,
                longitude: organizer.organizerDetails.longitude,
              }
            ),
          };
        });

        const organizersFiltered = organizers.filter(
          (organizer) => organizer.distance <= req.params.preferenceRadius
        );

        if (organizersFiltered.length) {
          res.json({
            result: true,
            organizers: organizersFiltered.sort(
              (a, b) => a.distance - b.distance
            ),
          });
        } else {
          res.json({
            result: false,
            error: `Aucun organisateur trouvé à moins de ${req.params.preferenceRadius} KM dans la base de données`,
          });
        }
      } else {
        res.json({
          result: false,
          error: "Aucun organisateur trouvé dans la base de données",
        });
      }
    });
});

module.exports = router;
