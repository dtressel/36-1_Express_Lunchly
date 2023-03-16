const express = require('express');
const router = new express.Router();

const Message = require('../models/message');
const middleware = require('../middleware/auth');

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/

router.get('/:id',
  middleware.ensureLoggedIn,
  async (req, res, next) => {
    try {
      const {id} = req.params;
      // Get message details
      const message = await Message.get(id);
      req.message = message;
      next();
    } catch(err) {
      next(err);
    }
  },
  middleware.ensureRecipientOrSender,
  async (req, res, next) => {
    res.json({message: req.message});
  }
);

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/

router.post('/', 
  middleware.ensureLoggedIn,
  async (req, res, next) => {
    try {
      const {to_username, body} = req.body;
      const from_username = req.user.username;
      console.log(req.user);
      console.log(from_username);
      // Get message details
      const message = await Message.create({from_username, to_username, body});
      res.json({message});
    } catch(err) {
      next(err);
    }
  }
)

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/

router.post('/:id/read',
  middleware.ensureRecipient,
  async (req, res, next) => {
    try {
      const message = await Message.markRead(req.params.id);
      res.json(message);
    }
    catch(err) {
      next(err);
    }
  }
);

module.exports = router;