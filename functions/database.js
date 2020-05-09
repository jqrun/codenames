const firebase = require('firebase');
require('firebase/firestore');

class Database {
  constructor() {
    firebase.initializeApp(JSON.parse(process.env.FIREBASE_CONFIG));
    this.db = firebase.firestore();
  }

  getDb() {
    return this.db;
  }
}

const database = new Database();
module.exports = database;