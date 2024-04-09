require("dotenv").config();

var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

require("./models/connection");
var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var activitiesRouter = require("./routes/activities");
var organizersRouter = require("./routes/organizers");

const swaggerUi = require("swagger-ui-express");
const swaggerFile = require("./swagger-output.json");
const bodyParser = require("body-parser");

var app = express();
const fileUpload = require("express-fileupload");
app.use(fileUpload());

/* Middlewares */
app.use(bodyParser.json());
app.use("/doc", swaggerUi.serve, swaggerUi.setup(swaggerFile));

const cors = require("cors");
app.use(cors());

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/activities", activitiesRouter);
app.use("/organizers", organizersRouter);

module.exports = app;
