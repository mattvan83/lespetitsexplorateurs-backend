var express = require("express");
var router = express.Router();
const uniqid = require("uniqid");

const cloudinary = require("cloudinary").v2;
const fs = require("fs");

const { convertCoordsToKm } = require("../modules/computeDistance");
const {
  determineDateBoundaries,
  determineTargetHours,
} = require("../modules/determineDateBoundaries");
const { checkBody } = require("../modules/checkBody");
const { invertMappingTable } = require("../modules/invertMapping");

const User = require("../models/users");
const Activity = require("../models/activities");

const categoryMapping = {
  Sport: "Sport",
  Musique: "Music",
  Créativité: "Creativity",
  Motricité: "Motricity",
  Éveil: "Awakening",
};

const backToFrontCategoryMapping = invertMappingTable(categoryMapping);

const ageMapping = {
  "3-12 mois": "3_12months",
  "1-3 ans": "1_3years",
  "3-6 ans": "3_6years",
  "6-10 ans": "6_10years",
  "10+ ans": "10+years",
};

const backToFrontAgeMapping = invertMappingTable(ageMapping);

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

const backToFrontErrorMapping = {};

router.post("/nogeoloc", (req, res) => {
  if (!checkBody(req.body, ["token"])) {
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

      // Collect all activities sorted by increasing date of happening.
      // The number of these activities is limited to a maximum of 15.
      Activity.find(findFilters)
        .populate("organizer")
        .then((activities) => {
          if (activities.length) {
            const activitiesMapped = activities
              .map((activity) => {
                // Mapping between backend and frontend categories
                let frontCategory = "";
                if (activity.category) {
                  frontCategory = backToFrontCategoryMapping[activity.category];
                }

                // Mapping between backend and frontend concernedAges
                let frontConcernedAges = [];
                // console.log("activity.concernedAges: ", activity.concernedAges);
                if (
                  Array.isArray(activity.concernedAges) &&
                  activity.concernedAges.length
                ) {
                  frontConcernedAges = activity.concernedAges.map(
                    (age) => backToFrontAgeMapping[age]
                  );
                }

                return {
                  id: activity._id,
                  imgUrl: activity.imgUrl,
                  organizer: activity.organizer.organizerDetails.name,
                  organizerImgUrl: activity.organizer.imgUrl,
                  date: activity.date,
                  name: activity.name,
                  postalCode: activity.postalCode,
                  city: activity.city,
                  latitude: activity.latitude,
                  longitude: activity.longitude,
                  isLiked: activity.likes.includes(userId),
                  description: activity.description,
                  locationName: activity.locationName,
                  concernedAges: frontConcernedAges,
                  category: frontCategory,
                  durationInMilliseconds: activity.durationInMilliseconds,
                };
              })
              .sort((a, b) => a.date - b.date);

            const activitiesFiltered = activitiesMapped.filter((activity) => {
              if (userFiltersCleaned.momentFilter) {
                const targetHours = determineTargetHours(
                  userFiltersCleaned.momentFilter
                );
                const activityHour = activity.date.getHours();

                if (targetHours.length === 1) {
                  return (
                    activityHour >= targetHours[0][0] &&
                    activityHour < targetHours[0][1]
                  );
                } else if (targetHours.length === 2) {
                  return (
                    (activityHour >= targetHours[0][0] &&
                      activityHour < targetHours[0][1]) ||
                    (activityHour >= targetHours[1][0] &&
                      activityHour < targetHours[1][1])
                  );
                }
              } else {
                return true;
              }
            });

            if (activitiesFiltered.length > 15) {
              res.json({
                result: true,
                activities: activitiesFiltered.slice(0, 15),
              });
            } else {
              res.json({
                result: true,
                activities: activitiesFiltered,
              });
            }
          } else {
            res.json({
              result: false,
              error:
                "Aucune activité trouvée avec les filtres utilisés dans la base de données",
            });
          }
        });
    } else {
      res.json({
        result: false,
        error: "Utilisateur non identifié en base de données",
      });
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
              // Mapping between backend and frontend categories
              let frontCategory = "";
              if (activity.category) {
                frontCategory = backToFrontCategoryMapping[activity.category];
              }

              // Mapping between backend and frontend concernedAges
              let frontConcernedAges = [];
              // console.log("activity.concernedAges: ", activity.concernedAges);
              if (
                Array.isArray(activity.concernedAges) &&
                activity.concernedAges.length
              ) {
                frontConcernedAges = activity.concernedAges.map(
                  (age) => backToFrontAgeMapping[age]
                );
              }

              return {
                id: activity._id,
                imgUrl: activity.imgUrl,
                organizer: activity.organizer.organizerDetails.name,
                organizerImgUrl: activity.organizer.imgUrl,
                organizerId: activity.organizer._id,
                date: activity.date,
                name: activity.name,
                postalCode: activity.postalCode,
                city: activity.city,
                latitude: activity.latitude,
                longitude: activity.longitude,
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
                description: activity.description,
                locationName: activity.locationName,
                concernedAges: frontConcernedAges,
                category: frontCategory,
                durationInMilliseconds: activity.durationInMilliseconds,
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
                error: `Aucune activité trouvée avec les filtres utilisés et à moins de ${req.body.scope} KM dans la base de données`,
              });
            }
          } else {
            res.json({
              result: false,
              error:
                "Aucune activité trouvée avec les filtres utilisés dans la base de données",
            });
          }
        });
    } else {
      res.json({
        result: false,
        error: "Utilisateur non identifié en base de données",
      });
    }
  });
});

//Get the activity informations for the ActivitySheet
router.get("/:id", (req, res) => {
  const activityId = req.params.id;

  Activity.findById(activityId).then((activity) => {
    if (activity) {
      res.json({
        result: true,
        activity: {
          organizer: activity.organizer,
          name: activity.name,
          description: activity.description,
          address: activity.address,
          postalCode: activity.postalCode,
          city: activity.city,
          locationName: activity.locationName,
          date: activity.date,
          duration: activity.durationInMilliseconds,
          imgUrl: activity.imgUrl,
          price: activity.price,
        },
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
      Activity.find({ author: userId })
        .populate("organizer")
        .then((activities) => {
          if (activities.length) {
            console.log(activities);
            const activitiesMapped = activities
              .map((activity) => {
                return {
                  id: activity._id,
                  imgUrl: activity.imgUrl,
                  description: activity.description,
                  category: activity.category,
                  concernedAges: activity.concernedAges,
                  price: activity.price,
                  durationInMilliseconds: activity.durationInMilliseconds,
                  organizer: activity.organizer.organizerDetails.name,
                  organizerImgUrl: activity.organizer.imgUrl,
                  date: activity.date,
                  name: activity.name,
                  address: activity.address,
                  postalCode: activity.postalCode,
                  city: activity.city,
                  locationName: activity.locationName,
                  isLiked: activity.likes.includes(userId),
                };
              })
              .sort((a, b) => a.date - b.date);

            res.json({ result: true, activities: activitiesMapped });
          } else {
            res.json({ result: false, error: "No activity found in database" });
          }
        });
    } else {
      res.json({ result: false, error: "User not found" });
    }
  });
});

// DELETE an activity
router.delete("/", (req, res) => {
  if (!checkBody(req.body, ["token", "activityId"])) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  User.findOne({ token: req.body.token }).then((user) => {
    if (user === null) {
      res.json({ result: false, error: "User not found" });
      return;
    }

    Activity.findById(req.body.activityId)
      .populate("author")
      .then((activity) => {
        if (!activity) {
          res.json({ result: false, error: "Activity not found" });
          return;
        } else if (String(activity.author._id) !== String(user._id)) {
          // ObjectId needs to be converted to string (JavaScript cannot compare two objects)
          res.json({
            result: false,
            error: "Activity can only be deleted by its author",
          });
          return;
        }

        Activity.deleteOne({ _id: activity._id }).then(() => {
          res.json({ result: true, activityId: activity._id });
        });
      });
  });
});

//Create a new activity - POST
router.post("/newActivity/:token", (req, res) => {
  User.findOne({ token: req.params.token })
    .then((data) => {
      if (!data) {
        throw new Error("User not found"); // Rejet de la promesse si aucun utilisateur n'est trouvé
      }
      const requiredFields = [];
      if (!checkBody(req.body, requiredFields)) {
        res.json({ result: false, error: "Missing or empty fields" });
        return;
      }
      const createdAt = new Date();

      const ages = [];
      for (let element of req.body.concernedAges) {
        ages.push(ageMapping[element]);
      }

      const newActivity = new Activity({
        author: data._id,
        organizer: data._id,
        createdAt,
        name: req.body.name,
        description: req.body.description,
        //durationInMilliseconds: req.body.duration,
        category: categoryMapping[req.body.category],
        concernedAges: ages,
        address: req.body.address,
        postalCode: req.body.postalCode,
        locationName: req.body.locationName,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        city: req.body.city,
        date: req.body.date,
        price: req.body.price,
        //isRecurrent: req.body.isRecurrent,
        //recurrence: req.body.recurrence,
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
    })
    .catch((error) => {
      res.status(500).json({ result: false, error: error.message }); // Capturer et gérer les erreurs ici
    });
});

// NEW activity PART 2: PHOTO à tester plus tard
router.post("/newPhoto/:id", async (req, res) => {
  const photoPath = `./tmp/${uniqid()}.jpg`;
  const resultMove = await req.files.photoFromFront.mv(photoPath);

  if (!resultMove) {
    const resultCloudinary = await cloudinary.uploader.upload(photoPath);

    Activity.findById(req.params.id).then((data) => {
      if (data) {
        Activity.updateOne(
          { _id: data._id },
          {
            $set: {
              imgUrl: resultCloudinary.secure_url,
            },
          }
        ).then((data) => {
          if (data) {
            res.json({ result: true, url: resultCloudinary.secure_url });
          } else {
            res.json({
              result: false,
              error: "An error occured during image upload",
            });
          }
        });
      } else {
        res.json({ result: false, error: "Activity not found" });
      }
    });
  } else {
    res.json({ result: false, error: resultMove });
  }

  fs.unlinkSync(photoPath);
});

//FAVORIS - Route PUT modification de la liste des favoris
router.put("/favorite/:token/:activityId", (req, res) => {
  User.findOne({ token: req.params.token })
    .then((data) => {
      if (!data) {
        throw new Error("User not found"); // Rejet de la promesse si aucun utilisateur n'est trouvé
      }

      const activityId = req.params.activityId;

      Activity.findById(activityId)
        .then((activity) => {
          if (!activity) {
            return res.json({ message: "Activity not found" });
          }

          // if user already liked the activity -> remove him from the 'likes' array
          if (activity.likes.includes(data._id)) {
            activity.likes = activity.likes.filter(
              (userId) => userId.toString() !== data._id.toString()
            );
          } else {
            activity.likes.push(data._id);
          }

          return activity.save();
        })
        .then((updatedActivity) => {
          res.json({
            message: "Activity liked successfully",
            activity: updatedActivity,
          });
        });
    })
    .catch((error) => {
      console.error(error);
      res.json({ error: "Failed to update activity" });
    });
});

// GET the favorite activities of the user
router.get("/favorite/:token", (req, res) => {
  User.findOne({ token: req.params.token }).then((data) => {
    if (data) {
      const userId = data._id;
      // Collect all activities of the user sorted by increasing date of happening.
      Activity.find({ author: userId })
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

            res.json({ result: true, activities: activitiesMapped });
          } else {
            res.json({
              result: false,
              error: "No favorite activity found in database",
            });
          }
        });
    } else {
      res.json({ result: false, error: "User not found" });
    }
  });
});

// Update activity
router.put("/update", (req, res) => {
  if (!checkBody(req.body, ["token"])) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  User.findOne({ token: req.body.token }).then((user) => {
    if (user === null) {
      res.json({ result: false, error: "User not found" });
      return;
    }
    Activity.findById(req.body.id)
      .populate("author")
      .then((activity) => {
        if (!activity) {
          res.json({ result: false, error: "Activity not found" });
          return;
        } else if (String(activity.author._id) !== String(user._id)) {
          // ObjectId needs to be converted to string (JavaScript cannot compare two objects)
          res.json({
            result: false,
            error: "Activity can only be deleted by its author",
          });
          return;
        }

        Activity.updateOne(
          { _id: activity._id },
          {
            $set: {
              name: req.body.name,
              description: req.body.description,
              //durationInMilliseconds: req.body.duration,
              category: categoryMapping[req.body.category],
              concernedAges: ageMapping[req.body.concernedAges],
              address: req.body.address,
              postalCode: req.body.postalCode,
              locationName: req.body.locationName,
              latitude: req.body.latitude,
              longitude: req.body.longitude,
              price: req.body.price,
              city: req.body.city,
              date: req.body.date,
              //isRecurrent: req.body.isRecurrent,
              //recurrence: req.body.recurrence,
            },
          }
        ).then((data) => {
          if (data) {
            res.json({ result: true });
          } else {
            res.json({
              result: false,
              error: "An error occured during update",
            });
          }
        });
      });
  });
});

module.exports = router;
