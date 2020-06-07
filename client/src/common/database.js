import firebase from 'firebase/app';

import 'firebase/analytics';
import 'firebase/database';

if (!firebase.apps.length) {
  firebase.initializeApp({
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
  });
  firebase.analytics();
}

class Database {
  constructor() {
    this.db = firebase.database();
    this.watches = [];
  }

  async roomExists(roomId) {
    return (await this.db.ref(`rooms/${roomId}`).once('value')).exists();
  }

  get(path, callback) {
    this.db.ref(path).once('value', snapshot => callback(snapshot.val()));
  }

  async watch(path, event, callback) {
    this.watches.push({path, event});
    this.db.ref(path).on(event, snapshot => callback(snapshot.val()));
  }

  unwatchAll() {
    this.watches.forEach(({path, event}) => this.db.ref(path).off(event));
  }

  getAnalytics() {
    return this.analytics;
  }
}

export default new Database();