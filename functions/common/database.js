const admin = require('firebase-admin');
const serviceAccount = require("../../secrets/firebase_admin_key.json");

class Database {
  constructor() {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: "https://codenames-273814.firebaseio.com"
    });

    this.db = admin.firestore();

    this.pubSub = {};
  }

  getDb() {
    return this.db;
  }
}

module.exports = new Database();