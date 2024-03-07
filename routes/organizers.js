var express = require("express");
var router = express.Router();

const User = require("../models/users");

// GET all organizers if no geolocalisation data available
router.get("/nogeoloc", (req, res) => {
    User.find({ isOrganizer: true }).select('_id image organizerDetails.name').then((data) => {
        if (data) {
            console.log(data)
            res.json({ result: true, organizer: data });
        } else {
            res.json({ result: false, error: "No results" });
        }
    });
});

module.exports = router;