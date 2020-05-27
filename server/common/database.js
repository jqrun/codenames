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

class Database {
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

    const roomCreate = this.db.ref(`rooms/${roomId}`).set({
      roomId,
      timestamps: {
        created: ServerValue.TIMESTAMP,
        lastUpdate: ServerValue.TIMESTAMP,
      }
    });
    const gameCreate = this.db.ref(`games/${roomId}`).set(Game.generateNewGame());
    await Promise.all([roomCreate, gameCreate]);
    return true;
  }

  async updateRoomTimestamp({roomId}) {
    const roomRef = this.db.ref(`rooms/${roomId}`);
    const room = (await roomRef.once('value')).val();
    room.timestamps.lastUpdate = ServerValue.TIMESTAMP;
    await roomRef.set(room);
  }

  deleteRoom({roomId}) {
    ['rooms', 'users', 'games', 'messages'].forEach(path => {
      this.db.ref(`${path}/${roomId}`).remove();
    })
  }

  async createUser({roomId, name}) {
    const usersRef = this.db.ref(`users/${roomId}`);
    const users = (await usersRef.once('value')).val() || {};
    const userId = this.getUniqueId();
    if (Users.nameExists(users, name)) return null;

    const team = Users.getNextBalancedTeam(users);
    const user = {
      userId,
      name,
      team,
      spymaster: false,
    };
    users[userId] = user;
    const createUser = usersRef.set(users);
    const updateRoom = this.updateRoomTimestamp({roomId});
    await Promise.all([createUser, updateRoom]);
    return userId;
  }

  async deleteUser({roomId, userId}) {
    const usersRef = this.db.ref(`users/${roomId}`);
    const users = (await usersRef.once('value')).val() || {};

    delete users[userId];
    const deleteUser = usersRef.set(users);
    const updateRoom = this.updateRoomTimestamp({roomId});
    await Promise.all([deleteUser, updateRoom]);
    return userId;
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
    const gameRef = this.db.ref(`games/${roomId}`);
    const game = (await gameRef.once('value')).val();
    if (game.board[cardIndex].revealed) return false;
    if (Game.isGameOver(game)) return false;

    const {type: revealedType} = game.board[cardIndex];
    game.board[cardIndex].revealed = true;
    Game.setCurrentTurn({game, revealedType});

    const revealCard = await gameRef.set(game);
    const updateRoom = this.updateRoomTimestamp({roomId});
    await Promise.all([revealCard, updateRoom]);
    return true;
  }

  async endTurn({roomId, userId}) {
    const swap = {blue: 'red', red: 'blue'};
    const gameRef = this.db.ref(`games/${roomId}`);
    const game = (await gameRef.once('value')).val();
    const {currentTurn} = game;
    if (!['blue', 'red'].includes(currentTurn)) return false;
    game.currentTurn = swap[currentTurn];

    const endTurn = await gameRef.set(game);
    const updateRoom = this.updateRoomTimestamp({roomId});
    await Promise.all([endTurn, updateRoom]);
    return true;
  }

  async startNewGame({roomId, userId}) {
    await this.db.ref(`games/${roomId}`).set(Game.generateNewGame());
    return true;
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
    }, 60 * 60 * 1000);
  }
}

class Users {
  static nameExists(users, name) {
    return Object.values(users).some(user => user.name.toLowerCase() === name.toLowerCase());
  }

  static getNextBalancedTeam(users) {
    users = Object.values(users);
    const numBlue = users.filter(user => user.team === 'blue').length;
    const numRed = users.filter(user => user.team === 'red').length;

    if (numBlue !== numRed) return numBlue > numRed ? 'red' : 'blue';
    return Math.random() < 0.5 ? 'red': 'blue';
  }
}

class Game {
  static setCurrentTurn({game, revealedType}) {
    const swap = {blue: 'red', red: 'blue'};
    const previousTurn = game.currentTurn;
    const advanceTurn = previousTurn === revealedType;
    const typesLeft = Game.getTypesLeft(game);

    if (revealedType === 'assassin') {
      game.currentTurn = `${swap[previousTurn]}_win`;
    } else if (!typesLeft.blue || !typesLeft.red) {
      game.currentTurn = `${previousTurn}_win`;
    } else if (!advanceTurn) {
      game.currentTurn = swap[previousTurn];
    }
  }

  static isGameOver(game) {
    return game.currentTurn.includes('win');
  }

  static getTypesLeft(game) {
    const {board} = game;
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
    const cards = words.map((word, index) => {
      return {index, word, type: 'bystander', revealed :false}
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

module.exports = new Database();



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