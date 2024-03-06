var express = require("express");
var router = express.Router();

const User = require("../models/users");
const { checkBody } = require('../modules/checkBody');
const bcrypt = require('bcrypt');
const uid2 = require('uid2');

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
    if (data && bcrypt.compareSync(req.body.password, data.password)) {
      res.json({ result: true, token: data.token, username: data.username });
    } else {
      res.json({ result: false, error: 'User not found or wrong password' });
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

module.exports = router;
