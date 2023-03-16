/** User class for message.ly */

// Import bcrypt and work factor variable from cofig
const bcrypt = require('bcrypt');
const {BCRYPT_WORK_FACTOR} = require('../config');

const ExpressError = require('../expressError');
const db = require('../db');

/** User of the site. */

class User {

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({username, password, first_name, last_name, phone}) {
    // Hash Password
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    // Save to db
    const results = await db.query(`
      Insert INTO users (username, password, first_name, last_name, phone, join_at, last_login_at)
      VALUES ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
      RETURNING username, password, first_name, last_name, phone`,
      [username, hashedPassword, first_name, last_name, phone]
    );
    return results.rows[0];
  }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    // Query user
    const queryResults = await db.query(
      `SELECT username, password
       FROM users
       WHERE username = $1`,
      [username]
    );
    const userObj = queryResults.rows[0];

    // Check if username was found and if password correct
    if (userObj && await bcrypt.compare(password, userObj.password)) {
      return true;
    } else {
      return false
    }
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    await db.query(
      `UPDATE users
       SET last_login_at = current_timestamp
       WHERE username = $1`,
      [username]
    );
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() {
    // Query all users
    const queryResults = await db.query(
      `SELECT username, first_name, last_name, phone
       FROM users`
    );
    return queryResults.rows;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    // Query user
    const queryResults = await db.query(
      `SELECT username, first_name, last_name, phone, join_at, last_login_at
       FROM users
       WHERE username = $1`,
      [username]
    );

    // Check if username is found and if so return info
    if (!queryResults.rows[0]) {
      throw new ExpressError('User not found. Check username!', 404);
    } else {
      return queryResults.rows[0];
    }
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    // Query user's sent messages
    const messageQueryResults = await db.query(
      `SELECT id, to_username, body, sent_at, read_at
       FROM messages
       WHERE from_username = $1`,
      [username]
    );

    // If no results are returned check if user exists
    if (!messageQueryResults.rows[0]) {
      if (this.userInDatabase(username)) {
        return [];
      } else {
        throw new ExpressError('User not found. Check username!', 404);
      }
    }

    // Add to_user object and delete to_username from results
    for (const row of messageQueryResults.rows) {
      const toUserQuery = await db.query(
        `SELECT username, first_name, last_name, phone
         FROM users
         WHERE username = $1`,
        [row.to_username]
      )
      row.to_user = toUserQuery.rows[0];
      delete row.to_username;
    }
    return messageQueryResults.rows;
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    // Query user's received messages
    const messageQueryResults = await db.query(
      `SELECT id, from_username, body, sent_at, read_at
       FROM messages
       WHERE to_username = $1`,
      [username]
    )

    // If no results are returned check if user exists
    if (!messageQueryResults.rows[0]) {
      if (this.userInDatabase(username)) {
        return [];
      } else {
        throw new ExpressError('User not found. Check username!', 404);
      }
    }

    // Add from_user object and delete from_username from results
    for (const row of messageQueryResults.rows) {
      const fromUserQuery = await db.query(
        `SELECT username, first_name, last_name, phone
         FROM users
         WHERE username = $1`,
        [row.from_username]
      )
      row.from_user = fromUserQuery.rows[0];
      delete row.from_username;
    }
    return messageQueryResults.rows; 
  }

  // Method to check if username exists in database
  // Returns True or False

  static async userInDatabase(username) {
    const user = await db.query(
      `SELECT username
       FROM users
       WHERE username = $1`,
      [username]
    )
    return Boolean(user.rows[0]);
  }
}

module.exports = User;