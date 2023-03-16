const express = require('express');
const router = new express.Router();

const User = require('../models/user');
const middleware = require('../middleware/auth');

/** GET / - get list of users.
 *
 * => {users: [{username, first_name, last_name, phone}, ...]}
 *
 **/

router.get('/',
  middleware.ensureLoggedIn,
  async (req, res, next) => {
    try {
      // Get users
      const users = await User.all();
      res.json({users});
    } catch(err) {
      next(err);
    }
  }
);

/** GET /:username - get detail of users.
 *
 * => {user: {username, first_name, last_name, phone, join_at, last_login_at}}
 *
 **/

router.get('/:username',
  middleware.ensureCorrectUser,
  async (req, res, next) => {
    try {
      const {username} = req.params;
      // Get user details
      const user = await User.get(username);
      res.json({user});
    } catch(err) {
      next(err);
    }
  }
)

/** GET /:username/to - get messages to user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 from_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/

router.get('/:username/to',
  middleware.ensureCorrectUser,
  async (req, res, next) => {
    try {
      const {username} = req.params;
      // Get messages
      const messages = await User.messagesTo(username);
      res.json({messages});
    } catch(err) {
      next(err);
    }
  }
)

/** GET /:username/from - get messages from user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 to_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/

router.get('/:username/from',
  middleware.ensureCorrectUser,
  async (req, res, next) => {
    try {
      const {username} = req.params;
      // Get messages
      const messages = await User.messagesFrom(username);
      res.json({messages});
    } catch(err) {
      next(err);
    }
  }
)

module.exports = router;