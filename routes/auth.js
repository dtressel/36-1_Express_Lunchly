const express = require('express');
const router = new express.Router();

const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../config');

const ExpressError = require('../expressError');
const User = require('../models/user');

/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/

router.post('/login', async (req, res, next) => {
  try {
    const {username, password} = req.body;
    if (await User.authenticate(username, password)) {
      // Sign in user by creating JWT token to send
      const token = jwt.sign({username}, SECRET_KEY);
      // Update last-login
      await User.updateLoginTimestamp(username);
      // Send token
      return res.json({token});
    }
    throw new ExpressError('Invalid username/password combo', 400);
  } catch(err) {
    next(err);
  }
})


/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */

router.post('/register', async (req, res, next) => {
  try {
    const newUser = await User.register(req.body);
    // Sign in user by creating JWT token to send
    console.log({username: newUser.username});
    console.log(newUser);
    const token = jwt.sign({username: newUser.username}, SECRET_KEY);
    // Update last-login
    await User.updateLoginTimestamp(newUser.username);
    // Send token
    return res.json({token});
  } catch(err) {
    next(err);
  }
})

module.exports = router;