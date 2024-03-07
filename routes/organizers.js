var express = require("express");
var router = express.Router();

const User = require("../models/users");
const { convertCoordsToKm } = require("../modules/computeDistance");
const { checkBody } = require('../modules/checkBody');

// GET all organizers if no geolocalisation data available
router.get("/nogeoloc", (req, res) => {
    User.find({ isOrganizer: true }).select('_id image organizerDetails.name organizerDetails.function').then((data) => {
        if (data) {
            const organizers = data.map(organizer => {
                return {
                    id: organizer._id,
                    imgUrl: organizer.image,
                    name: organizer.organizerDetails.name,
                    function: organizer.organizerDetails.function,
                  };
            })
            res.json({ result: true, organizers: organizers });
        } else {
            res.json({ result: false, error: "No results" });
        }
    });
});

router.get("/geoloc/:preferenceRadius/:longitude/:latitude", (req, res) => {
    // We get the preferenceRadius from the Redux store
    if (!checkBody(req.params, ["preferenceRadius", "latitude", "longitude"])) {
        res.json({ result: false, error: "Missing or empty fields" });
        return;
      }

    User.find({ isOrganizer: true }).select('_id image organizerDetails.name organizerDetails.function organizerDetails.longitude organizerDetails.latitude').then((data) => {
        if (data) {
            const organizers = data.map(organizer => {
                return {
                    id: organizer._id,
                    imgUrl: organizer.image,
                    name: organizer.organizerDetails.name,
                    function: organizer.organizerDetails.function,
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
                        })
                  };
            })

            const organizersFiltered = organizers.filter(
                (organizer) => organizer.distance <= req.params.preferenceRadius
              );

            res.json({ result: true, organizers: organizersFiltered });
        } else {
            res.json({ result: false, error: "No results" });
        }
    });
});

module.exports = router;