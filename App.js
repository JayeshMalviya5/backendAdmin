const express = require("express");
const mongoose = require("mongoose");
const app = express();
const PORT = 8000;
const session = require("express-session");
const mongoDbSession = require("connect-mongodb-session")(session);
const validator = require("validator");
const userModel = require("./models/userModel");

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
const MONGO_KEY =
  "mongodb+srv://jayeshmalviya10:12341234@cluster0.xizruzz.mongodb.net/AccioAdminBackend";
app.set("view engine", "ejs");
mongoose
  .connect(MONGO_KEY)
  .then(() => {
    console.log("mongoDB connected");
  })
  .catch((error) => {
    console.log("not connected");
  });

  const store = new mongoDbSession({
    uri: MONGO_KEY,
    collection: "sessions",
  });
  
  //middlewares
  
  app.use(
    session({
      secret: "This is our april nodejs class",
      resave: false,
      saveUninitialized: false,
      store: store,
    })
  );

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  return res.send({
    login: "/login",
    register: "/register",
  });
});

app.get("/dashboard", (req, res) => {
    return res.send("You are at dashboard page");
  });

app.get("/register", (req, res) => {
  return res.render("register");
});

app.post("/register", async (req, res) => {
  const { name, email, username, password } = req.body;
  if (!name || !email || !username || !password) {
    return res.send("missing credenntial error");
  }

  if (!validator.isEmail(email)) {
    return res.send("enter a valid email");
  }

  if (
    typeof name != "string" ||
    typeof email != "string" ||
    typeof password != "string" ||
    typeof username != "string"
  ) {
    res.send("invalid information type");
  }

  const userObjEmailExits = await userModel.findOne({ email });
  console.log(userObjEmailExits);

  if (userObjEmailExits) {
    return res.send({
      status: 400,
      message: "Email Already Exits",
    });
  }

  //check is the username exits or not in Db;
  const userObjUsernameExits = await userModel.findOne({ username });
  console.log(userObjUsernameExits);

  if (userObjUsernameExits) {
    return res.send({
      status: 400,
      message: "Username Already Exits",
    });
  }

  const userObj = new userModel({
    //key:value
    name: name,
    email: email,
    password: password,
    username: username,
  });

  try {
    const userDb = userObj.save();
    // console.log(userDb);

    return res.redirect("/login");
  } catch (error) {
    return res.send({
      status: 500,
      message: "Database Error",
      error: error,
    });
  }
});

app.get("/login", (req, res) => {
  return res.render("login");
});

app.post("/login", async (req, res) => {
  //console.log(req.body);
  const { loginId, password } = req.body;
  //Data validation
  console.log(req.body);

  if (!loginId || !password) {
    return res.send({
      status: 400,
      message: "Missing credentials",
    });
  }
  if (typeof loginId !== "string" || typeof password !== "string") {
    return res.send({
      status: 400,
      message: "Invalid Data Format",
    });
  }

  //   //find the user obj from loginId
  let userDb = "";
  if (validator.isEmail(loginId)) {
    userDb = await userModel.findOne({ email: loginId });
  } else {
    userDb = await userModel.findOne({ username: loginId });
  }
  console.log(userDb);
  if (!userDb) {
    return res.send({
      status: 400,
      message: "User does not exist, Please register first",
    });
  }

  if (userDb.password != password) {
    return res.send({
      status: 400,
      message: "Password incorrect",
    });
  }

  req.session.isAuth = true;
  req.session.user = {
    username: userDb.name,
    email: userDb.email,
    userId: userDb._id,
  };
  console.log("this is session", req.session);
  return res.redirect("/dashboard");
});

//
