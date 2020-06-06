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

    // The JSON data stored in Firebase Realtime DB will have extremely unreadable but short
    // keys/values in order to optimize for download size (optimizing Firebase's pricing model).
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
      i: roomId, // roomId
      t: {       // timestamps
        c: ServerValue.TIMESTAMP, // created
        l: ServerValue.TIMESTAMP, // lastUpdate
      }
    });
    const gameCreate = this.db.ref(`games/${roomId}`).set(Game.generateNewGame());
    await Promise.all([roomCreate, gameCreate]);
    const link = `https://codenames-273814.web.app/room/${roomId}`;
    const text = `Welcome! Invite other players by sharing this page's link.`;
    this.createMessage({roomId, text});
    return true;
  }

  async updateRoomTimestamp({roomId}) {
    const roomRef = this.db.ref(`rooms/${roomId}`);
    const room = (await roomRef.once('value')).val();
    room.t.l = ServerValue.TIMESTAMP;
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
    if (Users.nameExists(users, name)) return null;

    const newUser = usersRef.push();
    const userId = newUser.key;

    const team = Users.getNextBalancedTeam(users);
    const user = {
      i: userId, // userId
      n: name,   // name
      t: team,   // team
      s: 0,      // spymaster
    };
    await newUser.set(user);
    this.updateRoomTimestamp({roomId});
    return userId;
  }

  async deleteUser({roomId, userId}) {
    const usersRef = this.db.ref(`users/${roomId}`);
    const users = (await usersRef.once('value')).val() || {};

    delete users[userId];
    await usersRef.set(users);
    this.updateRoomTimestamp({roomId});
    if (!Object.values(users).length) this.deleteRoom({roomId});
    return userId;
  }

  async createTestUsers({roomId}, numUsers) {
    const randomNames = Game.getRandomWords(gameWords.english.original, numUsers);
    for (let i = 0; i < randomNames.length; i++) {
      await this.createUser({roomId, name: randomNames[i]});
    }
  }

async switchTeam({roomId, userId}) {
    const swap = {b: 'r', r: 'b'};
    const teamRef = this.db.ref(`users/${roomId}/${userId}/t`);
    const team = (await teamRef.once('value')).val();
    if (!team) return false;

    await teamRef.set(swap[team]);
    this.updateRoomTimestamp({roomId});
    return true;
  }

  async toggleSpymaster({roomId, userId}) {
    const spymasterRef = this.db.ref(`users/${roomId}/${userId}/s`);
    const spymaster = (await spymasterRef.once('value')).val();

    await spymasterRef.set(spymaster ? 0 : 1);
    this.updateRoomTimestamp({roomId});
    return true;
  }

  async revealCard({roomId, name, cardIndex}) {
    const gameRef = this.db.ref(`games/${roomId}`);
    const game = (await gameRef.once('value')).val();
    if (game.b[cardIndex].r) return false;
    if (Game.isGameOver(game)) return false;

    const {t: revealedType, w: word} = game.b[cardIndex];
    game.b[cardIndex].r = 1;
    Game.setCurrentTurn({game, revealedType});

    await gameRef.set(game);
    this.updateRoomTimestamp({roomId});
    this.createMessage({roomId, sender: name, text: `${word.toLowerCase()},${revealedType}`});
    if (Game.isGameOver(game)) {
      this.createMessage({roomId, text: game.c});
    }
    return true;
  }

  async endTurn({roomId, name}) {
    const swap = {b: 'r', r: 'b'};
    const gameRef = this.db.ref(`games/${roomId}`);
    const game = (await gameRef.once('value')).val();
    const {c: currentTurn} = game;
    if (!['b', 'r'].includes(currentTurn)) return false;
    game.c = swap[currentTurn];

    await gameRef.set(game);
    this.updateRoomTimestamp({roomId});
    return true;
  }

  async startNewGame({roomId, name}) {
    await this.db.ref(`games/${roomId}`).set(Game.generateNewGame());
    return true;
  }

  async createMessage({roomId, text, messageId, sender = null, team = 'game'}) {
    const convertTeam = {blue: 'b', red: 'r', game: 'g'};
    const messagesRef = this.db.ref(`messages/${roomId}`);
    const newMessage = messagesRef.push();
    messageId = messageId || newMessage.key;
    const message = {
      i: messageId, // messageId
      t: text,      // text 
      s: sender,    // sender
      e: convertTeam[team],    // team
      m: ServerValue.TIMESTAMP // timestamp
    };

    await newMessage.set(message);
    this.updateRoomTimestamp({roomId});
    return messageId;
  }

  deleteStaleRooms() {
    setInterval(() => {
      this.db.ref('rooms').once('value', snapshot => {
        snapshot.forEach(roomSnapshot => {
          const roomId = roomSnapshot.key;
          const room = roomSnapshot.val();
          if (Date.now() - room.t.l > 60 * 60 * 1000) {
            this.deleteRoom({roomId});
          }
        });
      });
    }, 60 * 60 * 1000);
  }

  getFirestore() {
    return this.firestore;
  }

  getUniqueId() {
    return crypto.randomBytes(16).toString('hex');
  }
}

class Users {
  static nameExists(users, name) {
    return Object.values(users).some(user => user.n.toLowerCase() === name.toLowerCase());
  }

  static getNextBalancedTeam(users) {
    users = Object.values(users);
    const numBlue = users.filter(user => user.team === 'b').length;
    const numRed = users.filter(user => user.team === 'r').length;

    if (numBlue !== numRed) return numBlue > numRed ? 'r' : 'b';
    return Math.random() < 0.5 ? 'r': 'b';
  }
}

class Game {
  static setCurrentTurn({game, revealedType}) {
    const swap = {b: 'r', r: 'b'};
    const previousTurn = game.c;
    const advanceTurn = previousTurn === revealedType;
    const typesLeft = Game.getTypesLeft(game);

    if (revealedType === 'a') {
      game.c = `${swap[previousTurn]}w`;
    } else if (!typesLeft.blue || !typesLeft.red) {
      game.c = `${previousTurn}w`;
    } else if (!advanceTurn) {
      game.c = swap[previousTurn];
    }
  }

  static isGameOver(game) {
    return game.c.includes('w');
  }

  static getTypesLeft(game) {
    const {b: board} = game;
    const types = Object.values(board).filter(c => !c.r).map(c => c.t);
    return {
      blue: types.filter(type => type === 'b').length,
      red: types.filter(type => type === 'r').length,
      bystander: types.filter(type => type === 'y').length,
      assassin: types.filter(type => type === 'a').length,
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
    const cards = words.map((word, index) => ({
        i: index, // index
        w: word,  // word 
        t: 'y',   // type
        r: 0,     //revealed
    }));
    const firstAgent = Math.random() < 0.5 ? 'b' : 'r';
    const secondAgent = firstAgent === 'b' ? 'r' : 'b';

    cards[Math.floor(Math.random() * cards.length)].t = 'a';

    while (numAgents) {
      const randomIndex = Math.floor(Math.random() * cards.length);
      if (cards[randomIndex].t !== 'y') continue;

      const agentType = numAgents % 2 === 1 ? firstAgent : secondAgent;
      cards[randomIndex].t = agentType;
      numAgents--;
    }

    return {cards: {...cards}, firstAgent};
  }

  static generateNewGame() {
    const randomWords =  Game.getRandomWords(gameWords.english.original, 25);
    const {cards, firstAgent} = Game.assignRandomCards(randomWords, 17);
    return {
      b: cards,      // board
      c: firstAgent, // currentTurn
    };
  }
}

module.exports = new Database();