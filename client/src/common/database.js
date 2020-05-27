import * as firebase from 'firebase/app';
import firebaseConfig from '../secrets/firebase_config.json';
import 'firebase/database';

firebase.initializeApp(firebaseConfig);

class Database {
  constructor() {
    this.db = firebase.database();
  }

  async getRoom(roomId, callback) {
    this.db.ref(`rooms/${roomId}`).once('value', snapshot => callback(snapshot.val()));
  }

  async watch(path, roomId, callback) {
    this.db.ref(`${path}/${roomId}`).on('value', snapshot => callback(snapshot.val()));
  }

  unwatch(path, roomId) {
    this.db.ref(`${path}/${roomId}`).off('value');
  }

}

export default new Database();