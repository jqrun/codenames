const firebase = require('firebase');
require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyCAEEz2hilZoy1niHMU4Bi3m6LouZSkknM",
  authDomain: "codenames-273814.firebaseapp.com",
  databaseURL: "https://codenames-273814.firebaseio.com",
  projectId: "codenames-273814",
  storageBucket: "codenames-273814.appspot.com",
  messagingSenderId: "825324062075",
  appId: "1:825324062075:web:46e39a5de955e038a669de",
  measurementId: "G-K289QC9ZQM"
};

class Database {
  constructor() {
    firebase.initializeApp(firebaseConfig);
    this.db = firebase.firestore();
  }

  getDb() {
    return this.db;
  }
}

const database = new Database();
module.exports = database;