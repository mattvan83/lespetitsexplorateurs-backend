var express = require("express");
var router = express.Router();

const User = require("../models/users");
const { checkBody } = require('../modules/checkBody');
const bcrypt = require('bcrypt');
const uid2 = require('uid2');
const uniqid = require('uniqid');

const cloudinary = require('cloudinary').v2;
const fs = require('fs');

/* ACCOUNT CREATION */
router.post('/signup', (req, res) => {

  if (!checkBody(req.body, ['email', 'username', 'password'])) {
    res.json({ result: false, error: 'Missing or empty fields' });
    return;
  }

  // Check if the user has not already been registered
  User.findOne({
    // Check if the username OR the email already exist
    $or: [
      { username: { $regex: new RegExp(req.body.username, 'i') } },
      { email: { $regex: new RegExp(req.body.email, 'i') } }
    ]
  }).then(data => {
    if (data === null) {
      const hash = bcrypt.hashSync(req.body.password, 10);

      const newUser = new User({
        email: req.body.email,
        username: req.body.username,
        password: hash,
        token: uid2(32),
      });

      newUser.save().then(newUser => {
        res.json({ result: true, token: newUser.token });
      });
    } else {
      // User already exists in database
      res.json({ result: false, error: 'User already exists' });
    }
  });
});

/* CONNEXION */
router.post('/signin', (req, res) => {
  if (!checkBody(req.body, ['email', 'password'])) {
    res.json({ result: false, error: 'Missing or empty fields' });
    return;
  }

  User.findOne({ email: { $regex: new RegExp(req.body.email, 'i') } }).then(data => {
    if (data === null) {
      res.json({ result: false, error: 'User not found' });
      return;
    } else {
      if (data && bcrypt.compareSync(req.body.password, data.password)) {
        res.json({ result: true, token: data.token, username: data.username, userPreferences: data.userPreferences });
      } else {
        res.json({ result: false, error: 'Wrong password' });
      }
    }
  });
});

//Get the organizer name for ActivitySheet
router.get('/:id', (req, res) => {
  const userId = req.params.id;

  User.findById(userId)
    .then(data => {
      if (data) {
        res.json({ result: true, name: data.organizerDetails.name, image: data.image });
      } else {
        res.json({ result: false, error: 'User not found' });
      }
    });
});

// Update user preferences
router.put('/updatePreferences', (req, res) => {
  const token = req.body.token;

  User.find({ token: token })
    .then(data => {
      if (data) {
        User.updateOne({ token: token }, { $set: { 'userPreferences.concernedAges': req.body.concernedAges, 'userPreferences.radius': req.body.radius, 'userPreferences.city': req.body.city, 'userPreferences.latitude': req.body.latitude, 'userPreferences.longitude': req.body.longitude } })
          .then(data => {
            if (data) {
              res.json({ result: true });
            } else {
              res.json({ result: false, error: 'An error occured during update' });
            }
          });
      } else {
        res.json({ result: false, error: 'User not found' });
      }
    });
});

// Organizer profile creation - PART 1: ADD DETAILS 
router.post('/newOrganizer/:token', async (req, res) => {
  console.log(req.body)
    const { name, title, about, postalCode, city, address, longitude, latitude } = req.body;
    console.log(title)

    User.find({ token: req.params.token })
      .then(data => {
        if (data) {
          User.updateOne({ token: req.params.token },
            {
              $set: {
                isOrganizer: true,
                'organizerDetails.name': name,
                'organizerDetails.title': title,
                'organizerDetails.about': about,
                'organizerDetails.postalCode': postalCode,
                'organizerDetails.city': city,
                'organizerDetails.address': address,
                'organizerDetails.longitude': longitude,
                'organizerDetails.latitude': latitude,
              }
            })
            .then(data => {
              if (data) {
                res.json({ result: true });
              } else {
                res.json({ result: false, error: 'An error occured during update' });
              }
            });
        } else {
          res.json({ result: false, error: 'User not found' });
        }
      });
});

// Organizer profile creation - PART 2: ADD PROFILE PIC
router.post('/newOrganizerPhoto/:token', async (req, res) => {
  const photoPath = `./tmp/${uniqid()}.jpg`;
  const resultMove = await req.files.photoFromFront.mv(photoPath);

  if (!resultMove) {
    const resultCloudinary = await cloudinary.uploader.upload(photoPath)

    User.find({ token: req.params.token })
      .then(data => {
        if (data) {
          User.updateOne({ token: req.params.token },
            {
              $set: {
                imgUrl: resultCloudinary.secure_url,
              }
            })
            .then(data => {
              if (data) {
                res.json({ result: true, url: resultCloudinary.secure_url });
              } else {
                res.json({ result: false, error: 'An error occured during image upload' });
              }
            });
        } else {
          res.json({ result: false, error: 'User not found' });
        }
      });

    // res.json({ result: true, url: resultCloudinary.secure_url });    
  } else {
    res.json({ result: false, error: resultMove });
  }

  fs.unlinkSync(photoPath);

});

module.exports = router;
