const admin = require('firebase-admin');
const crypto = require('crypto');
const gameWords = require('../assets/game_words.json');
const lock = require('./lock');
const serviceAccount = require("../secrets/firebase_admin_key.json");

class Database {
  constructor() {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: "https://codenames-273814.firebaseio.com"
    });

    this.firestore = admin.firestore();
    this.db = {};
    this.watchers = [];
  }

  getRooms() {
    return Object.values(this.db);
  }

  getRoom({roomId}) {
    return this.db[roomId];
  }

  async createRoom({roomId}) {
    return await lock.acquire('rooms', release => {
      if (this.db[roomId]) {
        release();
        return this.db[roomId];
      }

      const now = Number(Date.now());
      const room = {
        roomId,
        users: {},
        messages: [],
        game: Game.generateNewGame(),
        timestamps: {
          created: now,
          lastUpdate: now,
          lastDataStore: null,
        }
      };
      this.db[roomId] = room;
      release();
    });
  }

  deleteRoom({roomId}) {

  }

  async createUser({roomId, name}) {
    if (!this.db[roomId]) return;
    return await lock.acquire(`${roomId}-users`, release => {
      if (Users.nameExists(this.db[roomId], name)) {
        release();
        return null;
      }

      const team = Users.getNextBalancedTeam(this.db[roomId]);
      const userId = this.getUniqueId();
      const user = {
        userId,
        name,
        team,
        spymaster: false,
      };
      this.db[roomId].users[userId] = user;
      this.triggerUpdate(roomId);
      release();
      return userId;
    });
  }

  deleteUser({roomId, userId}) {
    if (!this.db[roomId]) return;
    delete this.db[roomId].users[userId];
    this.triggerUpdate(roomId);
  }

  createTestUsers({roomId}) {
    if (!this.db[roomId]) return;
    Game.getRandomWords(gameWords.english.original, 50).forEach(word => {
      this.createUser({roomId, word});
    });
  }

  switchTeams({roomId, userId}) {
    if (!this.db[roomId]) return;

  }

  setSpymater({roomId, userId}) {
    if (!this.db[roomId]) return;

  }

  async revealCard({roomId, userId, cardIndex}) {
    if (!this.db[roomId]) return;
    return await lock.acquire(`${roomId}-card-${cardIndex}`, release => {
      if (this.db[roomId].game.board[cardIndex].revealed) {
        release();
        return false;
      }

      this.db[roomId].game.board[cardIndex].revealed = true;
      this.triggerUpdate(roomId);
      release();
      return true;
    });
  }

  async endTurn({roomId, userId}) {
    if (!this.db[roomId]) return;

  }

  startNewGame({roomId, userId}) {
    if (!this.db[roomId]) return;

  }

  sendChatMessage({roomId, userId, message}) {
    if (!this.db[roomId]) return;

  }

  sendGameMessage({roomId, message}) {
    if (!this.db[roomId]) return;

  }

  watchUpdates(callback) {
    this.watchers.push(callback);
  }

  triggerUpdate(roomId) {
    this.db[roomId].timestamps.lastUpdate = Number(Date.now());
    this.watchers.forEach(watcher => watcher(this.db[roomId], 'update'));
  }

  triggerDelete(roomId) {
    this.watchers.forEach(watcher => watcher(this.db[roomId], 'delete'));
  }

  getFirestore() {
    return this.firestore;
  }

  async commitToFirebase(room) {
    const roomId = room._id;
    await this.firestore.collection('rooms').doc(roomId).set(room);
  }

  async deleteFirebaseRoom(roomId) {
    await db.collection('rooms').doc(roomId).delete();
  }

  getUniqueId() {
    return crypto.randomBytes(16).toString('hex');
  }
}

class Users {
  static nameExists(room, name) {
    return Object.values(room.users).some(user => user.name === name);
  }

  static getNextBalancedTeam(room) {
    const users = Object.values(room.users);
    const numBlue = users.filter(user => user.team === 'blue').length;
    const numRed = users.filter(user => user.team === 'red').length;

    if (numBlue !== numRed) return numBlue > numRed ? 'red' : 'blue';
    return Math.random() < 0.5 ? 'red': 'blue';
  }
}

class Game {
  static setCurrentTurn(game) {
    // Blue
    // Red
    // Win [Blue, Red]
  }


  static getRandomWords(words, numWords) {
    const randomWords = [];
    const picked = new Set();

    while (numWords) {
      const pick = words[Math.floor(Math.random() * words.length)];
      if (picked.has(pick)) continue;
      randomWords.push(pick);
      picked.add(pick);
      numWords--;
    }
    return randomWords;
  }

  static assignRandomCards(words, numAgents) {
    const cards = words.map(word => {
      return {word, type: 'bystander', revealed :false}
    });
    const firstAgent = Math.random() < 0.5 ? 'blue' : 'red';
    const secondAgent = firstAgent === 'blue' ? 'red' : 'blue';

    cards[Math.floor(Math.random() * cards.length)].type = 'assassin';

    while (numAgents) {
      const randomIndex = Math.floor(Math.random() * cards.length);
      if (cards[randomIndex].type !== 'bystander') continue;

      const agentType = numAgents % 2 === 1 ? firstAgent : secondAgent;
      cards[randomIndex].type = agentType;
      numAgents--;
    }

    return {...cards};
  }

  static generateNewGame() {
    const randomWords =  Game.getRandomWords(gameWords.english.original, 25);
    const cards = Game.assignRandomCards(randomWords, 17);
    return {
      board: cards,
    };
  }
}

module.exports = new Database();