const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const { send } = require("express/lib/response");
const app = express();
const PORT = 8080;

app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');

/*---------------- Helper Functions ------------------ */
// generates string to be used as shortURL and userID
const generateRandomString = () => {
  const chars ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomString = '';
  let count = 0;

  while (count < 6) {
    randomString += chars.charAt(Math.floor(Math.random() * chars.length));
    count++;
  }
  return randomString;
};

const findUserByID = userID => {
  const users = Object.keys(userDatabase);
  for (let user of users) {
    if (userID === user) {
      return userDatabase[user];
    }
  }
};

const checkEmailExistence = email => {
  const users = Object.keys(userDatabase);
  for (let user of users) {
    if (userDatabase[user].email === email) {
      return true;
    }
  }
  return false;
};

const findUserByEmail = email => {
  const users = Object.keys(userDatabase);
  for (let user of users) {
    if (userDatabase[user].email === email) {
      return userDatabase[user].id;
    }
  }
};


/*---------------- Databases ------------------ */
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW"
},
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW"
},
};

const userDatabase = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  },
};

/*---------------- Routing ------------------ */
app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get('/urls', (req, res) => {
  const user = findUserByID(req.cookies["user_id"]);
  const templateVars = { 
    urls: urlDatabase,
    user,
  };
  res.render('urls_index', templateVars);
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  const user = findUserByID(req.cookies["user_id"])
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: req.cookies["user_id"],
  };
  /* redirects not logged in users trying to create shURL */
  if (!user) {
    res.redirect('/login');
  } else {
    res.redirect(`/urls/${shortURL}`);
  }
});

app.get("/urls/new", (req, res) => {
  const user = findUserByID(req.cookies["user_id"]);
  const templateVars = {
    user,
  };
  res.render("urls_new", templateVars);
});

app.get('/urls/:shortURL', (req, res) => {
  const user = findUserByID(req.cookies["user_id"]);
  const longURL = urlDatabase[req.params.shortURL].longURL;

  if (!longURL) {
    res.sendStatus(418); // should be 404 :)
  } else {
    const templateVars = { 
      shortURL: req.params.shortURL, 
      longURL: longURL,
      user,
    };
    res.render("urls_show", templateVars);
  }
});


/*---------------- Registration page routes ------------------ */
app.get("/register", (req, res) => {
  const user = findUserByID(req.cookies["user_id"]);
  const templateVars = {
    user,
  };
  res.render("register", templateVars);
});

app.post("/register", (req, res) => {
  const userID = generateRandomString();
  const {email, password} = req.body;
 
  if (!email.length || !password.length) {
    res.status(404).send('Enter your email AND password to register');
  } else if (checkEmailExistence(email)) {
    res.status(404).send('User with such e-mail is already registered');
  } else {
    userDatabase[userID] = {
      id: userID,
      email,
      password
    }
  
    res.cookie("user_id", userID).redirect("/urls");
  }
});

/*---------------- Login/Logout page routes ------------------ */
app.get("/login", (req, res) => {
  const user = findUserByID(req.cookies["user_id"]);
  const templateVars = {
    user,
  };
  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  const {email, password} = req.body;
  const user = findUserByEmail(email);
  
  if (!checkEmailExistence(email)) {
    res.status(403).send('There is no user with this email');
  } else if (userDatabase[user].password !== password) {
    res.status(403).send('Password you entered is incorrect');
  } else {
    res.cookie("user_id", user).redirect("/urls");
  }
  
});

app.post("/logout", (req, res) => {
  
  res.clearCookie("user_id").redirect("/login");
});

/*----------------  ------------------ */
app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: req.cookies["user_id"],
  };
  
  res.redirect("/urls");
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  
  res.redirect('/urls');
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// setting up a server
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});