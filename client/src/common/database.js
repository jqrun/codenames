import * as firebase from 'firebase/app';
import 'firebase/database';

if (!firebase.apps.length) {
  firebase.initializeApp({
    "authDomain": "codenames-273814.firebaseapp.com",
    "databaseURL": "https://codenames-273814.firebaseio.com",
    "projectId": "codenames-273814",
    "storageBucket": "codenames-273814.appspot.com",
    "messagingSenderId": "825324062075",
    "appId": "1:825324062075:webte:46e39a5de955e038a669de",
    "measurementId": "G-K289QC9ZQM"
  });
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

}

export default new Database();