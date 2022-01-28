// generates string to be used as shortURL and userID

const generateRandomString = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomString = '';
  let count = 0;

  while (count < 6) {
    randomString += chars.charAt(Math.floor(Math.random() * chars.length));
    count++;
  }
  return randomString;
};

const checkEmailExistence = (email, database) => {
  const users = Object.keys(database);

  for (let user of users) {
    if (database[user].email === email) {
      return true;
    }
  }
  return false;
};

const findUserByEmail = (email, database) => {
  const users = Object.keys(database);
  for (let user of users) {
    if (database[user].email === email) {
      return database[user];
    }
  }
};

const urlsForUser = (id, database) => {
  const userURLs = {};
  const shortURLs = Object.keys(database);

  for (let shortURL of shortURLs) {
    if (database[shortURL].userID === id) {
      userURLs[shortURL] = database[shortURL].longURL;
    }
  }
  return userURLs;
};

module.exports = { generateRandomString, findUserByEmail, checkEmailExistence, urlsForUser };