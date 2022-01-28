const express = require("express");
const app = express();
const PORT = 8080;

const cookieSession = require("cookie-session");
const bodyParser = require("body-parser");
const bcrypt = require('bcryptjs');

app.set('view engine', 'ejs');

const { userDatabase, urlDatabase } = require("./database");
const { generateRandomString, findUserByEmail, checkEmailExistence, urlsForUser } = require('./helpers');

// set middleware

app.use(bodyParser.urlencoded({extended: true}));

app.use(cookieSession({
  name: 'session',
  keys: [generateRandomString(), generateRandomString()],
  maxAge: 24 * 60 * 60 * 1000,
}));




/*----------------------- Routing ------------------------- */
/*-------------------------------------------------------- */


/*------------------- Home Page route --------------------- */

//redirects to login page not logged in users, otherwise to list of urls
app.get("/", (req, res) => {
  const userID = req.session["user_id"];
  
  if (!userID) {
    res.redirect("/login");
  } else {
    res.redirect("/urls");
  }
});

/*---------------- List of Urls Page routes ------------------ */

app.get('/urls', (req, res) => {
  const userID = req.session["user_id"];
  const userURLs = urlsForUser(userID, urlDatabase);
  
  const templateVars = {
    urls: userURLs,
    user: userDatabase[userID],
  };
  res.render('urls_index', templateVars);
});

// add new url to database if user is logged in
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  const userID = req.session["user_id"];
  const user = userDatabase[userID];
  
  // redirects not logged in users trying to create shURL
  if (!user) {
    res.redirect('/login');
  } else {
    urlDatabase[shortURL] = {
      longURL: req.body.longURL,
      userID,
    };
    
    res.redirect(`/urls/${shortURL}`);
  }
});

/*--------------Create new shortURL Page routes ------------------ */

// redirects to login page if user not logged in
app.get("/urls/new", (req, res) => {
  const userID = req.session["user_id"];

  if (!userID) {
    res.redirect("/login");
  } else {
    const templateVars = {
      user: userDatabase[userID],
    };
  
    res.render("urls_new", templateVars);
  }
});

/*--------------Edit existing URL Page route ------------------ */

// if user is logged in and owns valid url - shows page, otherwise throws error
app.get('/urls/:shortURL', (req, res) => {
  const userID = req.session["user_id"];
  const userURLs = urlsForUser(userID, urlDatabase);
  const {shortURL} = req.params;

  if (!urlDatabase[shortURL]) {
    res.status(404).send(`${res.statusCode} - This page doesn't exist \n`);
  
  } else if (!userID) {
    res.status(401).send(`${res.statusCode} - Please log in to see this page \n`);

  } else if (!userURLs[shortURL]) {
    res.status(401).send(`${res.statusCode} - You don't have permission to manipulate this data \n`);

  } else {
    const {longURL} = urlDatabase[shortURL];
    const templateVars = {
      longURL,
      shortURL,
      user: userDatabase[userID],
    };
    res.render("urls_show", templateVars);
  }
});


/*---------------------- Registration page routes ---------------------- */

app.get("/register", (req, res) => {
  const userID = req.session["user_id"];
  const templateVars = {
    user: userDatabase[userID],
  };
  res.render("register", templateVars);
});

// make possible to register if both input fields not empty, and there is no user with such email
app.post("/register", (req, res) => {
  const userID = generateRandomString();
  const {email, password} = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);
  

  if (!email.length || !password.length) {
    res.status(404).send(`${res.statusCode} - Enter your email AND password to register`);
  } else if (checkEmailExistence(email, userDatabase)) {
    res.status(404).send(`${res.statusCode} - User with such e-mail is already registered`);
  } else {
    
    userDatabase[userID] = {
      id: userID,
      password: hashedPassword,
      email,
    };
    req.session["user_id"] = userID;
    res.redirect("/urls");
  }
});

/*------------------ Login/Logout page routes ------------------ */

app.get("/login", (req, res) => {
  const userID = req.session["user_id"];
  const templateVars = {
    user: userDatabase[userID],
  };

  res.render("login", templateVars);
});

// makes possible to login if passwords and emails mathch w/database
app.post("/login", (req, res) => {
  const {email, password} = req.body;
  const user = findUserByEmail(email, userDatabase);
  
  if (!checkEmailExistence(email, userDatabase)) {
    res.status(403).send(`${res.statusCode} - There is no user with this email`);

  } else if (!bcrypt.compareSync(password, userDatabase[user.id].password)) {
    res.status(403).send(`${res.statusCode} - Password you entered is incorrect`);

  } else {
    req.session["user_id"] = user.id;
    res.redirect("/urls");
  }
  
});

/* clears user's cookie and redirects to login page */
app.post("/logout", (req, res) => {
  req.session["user_id"] = null;
  res.redirect("/login");
});

/*---------------Edit/Delete existing URL routes ----------------- */

// make possible to edit user's own url
app.post("/urls/:id", (req, res) => {
  const userID = req.session["user_id"];
  const userURLs = urlsForUser(userID, urlDatabase);
  const shortURL = req.params.id;
  
  if (!userURLs[shortURL]) {
    res.status(401).send(`${res.statusCode} - You don't have permission to manipulate this data \n`);
  } else {
    urlDatabase[shortURL] = {
      longURL: req.body.longURL,
      userID: req.session["user_id"],
    };
    res.redirect('/urls');
  }
});

// make possible to delete user's own url
app.post("/urls/:shortURL/delete", (req, res) => {
  const userID = req.session["user_id"];
  const userURLs = urlsForUser(userID, urlDatabase);
  const {shortURL} = req.params;
  
  if (!userURLs[shortURL]) {
    res.status(401).send(`${res.statusCode} - You don't have permission to manipulate this data \n`);
  } else {
    delete urlDatabase[shortURL];
    res.redirect('/urls');
  }
});

/*------------ Redirects to long url by clicking on short ----------------- */

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});


/*-------------------------- Server setup ------------------------------ */

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});