const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080;

app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');

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
}

/*---------------- Databases ------------------ */
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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
  urlDatabase[shortURL] = req.body.longURL;
  
  res.redirect(`/urls/${shortURL}`);
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
  if (!urlDatabase[req.params.shortURL]) {
    res.sendStatus(418); // should be 404 :)
  } else {
    const templateVars = { 
      shortURL: req.params.shortURL, 
      longURL: urlDatabase[req.params.shortURL],
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
  userDatabase[userID] = {
    id: userID,
    email,
    password
  }

  res.cookie("user_id", userID).redirect("/urls");
});

/*---------------- Login/Logout page routes ------------------ */
app.post("/login", (req, res) => {
  const user = req.body.username;

  res.cookie("username", user).redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("username").redirect("urls");
});

/*----------------  ------------------ */
app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  urlDatabase[shortURL] = req.body.longURL;
  
  res.redirect("/urls");
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  
  res.redirect('/urls');
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// setting up a server
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});