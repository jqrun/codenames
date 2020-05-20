const admin = require('firebase-admin');
const pouchDb = require('pouchdb');
const serviceAccount = require("./secrets/firebase_admin_key.json");

class Database {
  constructor() {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: "https://codenames-273814.firebaseio.com"
    });

    this.firestore = admin.firestore();

    this.pouchDb = new pouchDb('rooms');
  }

  getFirestore() {
    return this.firestoreDb;
  }

  getPouchDb() {
    return this.pouchDb;
  }
}

module.exports = new Database();