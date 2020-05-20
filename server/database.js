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

  async commitToFirebase(room) {
    const roomId = room._id;
    await this.firestore.collection('rooms').doc(roomId).set(room);
  }

  async deleteFirebaseRoom(roomId) {
    await db.collection('rooms').doc(roomId).delete();
  }
}

module.exports = new Database();