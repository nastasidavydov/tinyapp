const { assert } = require('chai');

const { findUserByEmail } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

describe('findUserByEmail', function() {
  it('should return a user id with valid email', function() {
    const user = findUserByEmail("user@example.com", testUsers)
    const expectedUserID = "userRandomID";
    
    assert.strictEqual(user.id, expectedUserID)
  });

  it('should return undefined with invalid email', function() {
    const user = findUserByEmail("user123@example.com", testUsers)
    const expectedOutput = undefined;
    
    assert.strictEqual(user, expectedOutput)
  });
});