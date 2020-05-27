import * as firebase from 'firebase/app';
import firebaseConfig from '../secrets/firebase_config.json';
import 'firebase/database';

firebase.initializeApp(firebaseConfig);

class Database {
  constructor() {
    this.db = firebase.database();
  }

  async getRoom(roomId) {
    return (await this.db.ref(`rooms/${roomId}`).once('value')).val();
  }

  async watchRoom(roomId, callback) {
    this.db.ref(`rooms/${roomId}`).on('value', snapshot => callback(snapshot.val()));
  }

  unwatchRoom(roomId) {
    this.db.ref(`rooms/${roomId}`).off('value');
  }
}

export default new Database();