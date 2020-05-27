const admin = require('firebase-admin');
const crypto = require('crypto');
const gameWords = require('../assets/game_words.json');
const lock = require('./lock');
const logger = require('./logger');
const serviceAccount = require("../secrets/firebase_service_account.json");

const {ServerValue} = admin.database;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://codenames-273814.firebaseio.com"
});

class FirebaseRealtimeDatabase {
  constructor() {
    this.firestore = admin.firestore();
    this.db = admin.database();

    this.deleteStaleRooms();
  }

  async getRooms() {
    return Object.values((await this.db.ref('rooms').once('value')).val());
  }

  async createRoom({roomId}) {
    const room = this.db.ref(`rooms/${roomId}`);
    const exists = (await room.once('value')).exists();
    if (exists) return false;

    await this.db.ref(`rooms/${roomId}`).set({
      roomId,
      users: {},
      messages: [],
      game: Game.generateNewGame(),
      timestamps: {
        created: ServerValue.TIMESTAMP,
        lastUpdate: ServerValue.TIMESTAMP,
      }
    });
    return true;
  }

  deleteRoom({roomId}) {
    this.db.ref(`rooms/${roomId}`).remove();
  }

  async createUser({roomId, name}) {
    const roomRef = this.db.ref(`rooms/${roomId}`);
    const room = (await roomRef.once('value')).val();
    const userId = this.getUniqueId();
    room.users = room.users || {};
    if (Users.nameExists(room, name)) return null;

    const team = Users.getNextBalancedTeam(room);
    const user = {
      userId,
      name,
      team,
      spymaster: false,
    };
    room.users[userId] = user;
    room.timestamps.lastUpdate = ServerValue.TIMESTAMP
    await roomRef.set(room);
    return userId;
  }

  async deleteUser({roomId, userId}) {
    const roomRef = this.db.ref(`rooms/${roomId}`);
    const room = (await roomRef.once('value')).val();
    if (!room.users) return;

    delete room.users[userId];
    room.timestamps.lastUpdate = ServerValue.TIMESTAMP
    await roomRef.set(room);
  }

  createTestUsers({roomId}, numUsers) {
    Game.getRandomWords(gameWords.english.original, numUsers).forEach(word => {
      this.createUser({roomId, name: word});
    });
  }

  switchTeams({roomId, userId}) {
    if (!this.db[roomId]) return;

  }

  setSpymater({roomId, userId}) {
    if (!this.db[roomId]) return;

  }

  async revealCard({roomId, userId, cardIndex}) {
    const roomRef = this.db.ref(`rooms/${roomId}`);
    const room = (await roomRef.once('value')).val();
    if (room.game.board[cardIndex].revealed) return false;

    const {type: revealedType} = room.game.board[cardIndex];
    room.game.board[cardIndex].revealed = true;
    Game.setCurrentTurn({room, revealedType});

    if (Game.isGameOver(room)) {
      setTimeout(() => this.revealAll({roomId}), 1000);
    }

    room.timestamps.lastUpdate = ServerValue.TIMESTAMP
    await roomRef.set(room);
    return true;
  }

  async revealAll({roomId}) {
    const roomRef = this.db.ref(`rooms/${roomId}`);
    const room = (await roomRef.once('value')).val();

    Object.values(room.game.board).forEach(card => card.revealed = true);
    room.timestamps.lastUpdate = ServerValue.TIMESTAMP
    await roomRef.set(room);
    return true;
  }

  async endTurn({roomId, userId}) {
    const swap = {blue: 'red', red: 'blue'};
    const roomRef = this.db.ref(`rooms/${roomId}`);
    const room = (await roomRef.once('value')).val();
    if (Game.isGameOver(room)) return;

    const {currentTurn} = room.game;
    if (!['blue', 'red'].includes(currentTurn)) return false;
    room.game.currentTurn = swap[currentTurn];

    room.timestamps.lastUpdate = ServerValue.TIMESTAMP
    await roomRef.set(room);
    return true;
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

  getFirestore() {
    return this.firestore;
  }

  getUniqueId() {
    return crypto.randomBytes(16).toString('hex');
  }

  deleteStaleRooms() {
    setInterval(() => {
      this.db.ref('rooms').once('value', snapshot => {
        snapshot.forEach(roomSnapshot => {
          const roomId = roomSnapshot.key;
          const room = roomSnapshot.val();
          if (Date.now() - room.timestamps.lastUpdate > 60 * 60 * 1000) {
            this.deleteRoom({roomId});
          }
        });
      });
    }, 10 * 60 * 1000);
  }
}

class Users {
  static nameExists(room, name) {
    return Object.values(room.users).some(user => user.name.toLowerCase() === name.toLowerCase());
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
  static setCurrentTurn({room, revealedType}) {
    const swap = {blue: 'red', red: 'blue'};
    const previousTurn = room.game.currentTurn;
    const advanceTurn = previousTurn === revealedType;
    const typesLeft = Game.getTypesLeft({room});

    if (revealedType === 'assassin') {
      room.game.currentTurn = `${swap[previousTurn]}_win`;
    } else if (!typesLeft.blue || !typesLeft.red) {
      room.game.currentTurn = `${previousTurn}_win`;
    } else if (!advanceTurn) {
      room.game.currentTurn = swap[previousTurn];
    }
  }

  static isGameOver(room) {
    return room.game.currentTurn.includes('win');
  }

  static getTypesLeft({room}) {
    const {board} = room.game;
    const types = Object.values(board).filter(card => !card.revealed).map(card => card.type);
    return {
      blue: types.filter(type => type === 'blue').length,
      red: types.filter(type => type === 'red').length,
      bystander: types.filter(type => type === 'bystander').length,
      assassin: types.filter(type => type === 'assassin').length,
    };
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

    return {cards: {...cards}, firstAgent};
  }

  static generateNewGame() {
    const randomWords =  Game.getRandomWords(gameWords.english.original, 25);
    const {cards, firstAgent} = Game.assignRandomCards(randomWords, 17);
    return {
      board: cards,
      currentTurn: firstAgent,
    };
  }
}

module.exports = new FirebaseRealtimeDatabase();



// DEPRECATED: Used prior to realizing Firebase Realtime DB doesn't charge based on read/writes.
// class InMemoryDatabase {
//   constructor() {
//     this.firestore = admin.firestore();
//     this.db = {};
//     this.watchers = [];

//     this.deleteStaleRooms();
//   }

//   getRooms() {
//     return Object.values(this.db);
//   }

//   getRoom({roomId}) {
//     return this.db[roomId];
//   }

//   async createRoom({roomId}) {
//     return await lock.acquire('rooms', release => {
//       if (this.db[roomId]) {
//         release();
//         return this.db[roomId];
//       }

//       const now = Number(Date.now());
//       const room = {
//         roomId,
//         users: {},
//         messages: [],
//         game: Game.generateNewGame(),
//         timestamps: {
//           created: now,
//           lastUpdate: now,
//           lastDataStore: null,
//         }
//       };
//       this.db[roomId] = room;
//       release();
//     });
//   }

//   deleteRoom({roomId}) {
//     delete this.db[roomId];
//   }

//   async createUser({roomId, name}) {
//     if (!this.db[roomId]) return;
//     return await lock.acquire(`${roomId}-users`, release => {
//       if (Users.nameExists(this.db[roomId], name)) {
//         release();
//         return null;
//       }

//       const team = Users.getNextBalancedTeam(this.db[roomId]);
//       const userId = this.getUniqueId();
//       const user = {
//         userId,
//         name,
//         team,
//         spymaster: false,
//       };
//       this.db[roomId].users[userId] = user;
//       this.triggerUpdate(roomId);
//       release();
//       return userId;
//     });
//   }

//   deleteUser({roomId, userId}) {
//     if (!this.db[roomId]) return;
//     delete this.db[roomId].users[userId];
//     this.triggerUpdate(roomId);
//   }

//   createTestUsers({roomId}, numUsers) {
//     if (!this.db[roomId]) return;
//     Game.getRandomWords(gameWords.english.original, numUsers).forEach(word => {
//       this.createUser({roomId, name: word});
//     });
//   }

//   switchTeams({roomId, userId}) {
//     if (!this.db[roomId]) return;

//   }

//   setSpymater({roomId, userId}) {
//     if (!this.db[roomId]) return;

//   }

//   async revealCard({roomId, userId, cardIndex}) {
//     if (!this.db[roomId]) return;
//     if (Game.isGameOver(this.db[roomId])) return;

//     return await lock.acquire(`${roomId}-game`, release => {
//       if (this.db[roomId].game.board[cardIndex].revealed) {
//         release();
//         return false;
//       }

//       this.db[roomId].game.board[cardIndex].revealed = true;
//       const [room, revealedType] = [this.db[roomId], this.db[roomId].game.board[cardIndex].type];
//       Game.setCurrentTurn({room, revealedType});
//       if (Game.isGameOver(this.db[roomId])) {
//         setTimeout(() => this.revealAll({roomId}), 1000);
//       }
//       this.triggerUpdate(roomId);
//       release();
//       return true;
//     });
//   }

//   async revealAll({roomId}) {
//     if (!this.db[roomId]) return;

//     return await lock.acquire(`${roomId}-game`, release => {
//       Object.values(this.db[roomId].game.board).forEach(card => card.revealed = true);
//       this.triggerUpdate(roomId);
//       release();
//       return true;
//     });
//   }

//   async endTurn({roomId, userId}) {
//     if (!this.db[roomId]) return;
//     if (Game.isGameOver(this.db[roomId])) return;

//     return await lock.acquire(`${roomId}-game`, release => {
//       const {currentTurn} = this.db[roomId].game.currentTurn;
//       if (!['blue', 'red'].includes(currentTurn)) {
//         release();
//         return false;
//       }

//       this.db[roomId].game.currentTurn = currentTurn === 'blue' ? 'red' : 'blue';
//       this.triggerUpdate(roomId);
//       release()
//       return true;
//     });
//   }

//   startNewGame({roomId, userId}) {
//     if (!this.db[roomId]) return;

//   }

//   sendChatMessage({roomId, userId, message}) {
//     if (!this.db[roomId]) return;

//   }

//   sendGameMessage({roomId, message}) {
//     if (!this.db[roomId]) return;

//   }

//   watchUpdates(callback) {
//     this.watchers.push(callback);
//   }

//   triggerUpdate(roomId) {
//     this.db[roomId].timestamps.lastUpdate = Number(Date.now());
//     this.watchers.forEach(watcher => watcher(this.db[roomId], 'update'));
//   }

//   triggerDelete(roomId) {
//     this.watchers.forEach(watcher => watcher(this.db[roomId], 'delete'));
//   }

//   getFirestore() {
//     return this.firestore;
//   }

//   async commitToFirebase(room) {
//     const roomId = room._id;
//     await this.firestore.collection('rooms').doc(roomId).set(room);
//   }

//   async deleteFirebaseRoom(roomId) {
//     await db.collection('rooms').doc(roomId).delete();
//   }

//   getUniqueId() {
//     return crypto.randomBytes(16).toString('hex');
//   }

//   deleteStaleRooms() {
//     setInterval(() => {
//       Object.entries(this.db).forEach(([roomId, room]) => {
//         if (Date.now() - room.timestamps.lastUpdate > 60 * 60000) {
//           this.deleteRoom({roomId});
//         }
//       });
//     }, 10 * 10000);
//   }
// }