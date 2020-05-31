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
    const link = `https://codenames-273814.web.app/room/${roomId}`;
    const text = `Welcome! Invite other players by sharing this page's link.`;
    this.createMessage({roomId, text});
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
    if (Users.nameExists(users, name)) return null;

    const newUser = usersRef.push();
    const userId = newUser.key;

    const team = Users.getNextBalancedTeam(users);
    const user = {
      userId,
      name,
      team,
      spymaster: false,
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
    console.log('switch team');
    const swap = {blue: 'red', red: 'blue'};
    const teamRef = this.db.ref(`users/${roomId}/${userId}/team`);
    const team = (await teamRef.once('value')).val();
    if (!team) return false;

    await teamRef.set(swap[team]);
    this.updateRoomTimestamp({roomId});
    return true;
  }

  async toggleSpymaster({roomId, userId}) {
    const spymasterRef = this.db.ref(`users/${roomId}/${userId}/spymaster`);
    const spymaster = (await spymasterRef.once('value')).val();

    await spymasterRef.set(!spymaster);
    this.updateRoomTimestamp({roomId});
    return true;
  }

  async revealCard({roomId, name, cardIndex}) {
    const gameRef = this.db.ref(`games/${roomId}`);
    const game = (await gameRef.once('value')).val();
    if (game.board[cardIndex].revealed) return false;
    if (Game.isGameOver(game)) return false;

    const {type: revealedType, word} = game.board[cardIndex];
    game.board[cardIndex].revealed = true;
    Game.setCurrentTurn({game, revealedType});

    await gameRef.set(game);
    this.updateRoomTimestamp({roomId});
    this.createMessage({roomId, text: `${name} revealed ${word} (${revealedType})`});
    if (Game.isGameOver(game)) {
      const winner = game.currentTurn.split('_win')[0];
      this.createMessage({roomId, text: `${winner} wins!`.toUpperCase()});
    }
    return true;
  }

  async endTurn({roomId, name}) {
    const swap = {blue: 'red', red: 'blue'};
    const gameRef = this.db.ref(`games/${roomId}`);
    const game = (await gameRef.once('value')).val();
    const {currentTurn} = game;
    if (!['blue', 'red'].includes(currentTurn)) return false;
    game.currentTurn = swap[currentTurn];

    await gameRef.set(game);
    this.updateRoomTimestamp({roomId});
    return true;
  }

  async startNewGame({roomId, name}) {
    await this.db.ref(`games/${roomId}`).set(Game.generateNewGame());
    return true;
  }

  async createMessage({roomId, text, messageId, sender = null, team = 'game'}) {
    const messagesRef = this.db.ref(`messages/${roomId}`);
    const newMessage = messagesRef.push();
    messageId = messageId || newMessage.key;
    const message = {messageId, text, sender, team, timestamp: ServerValue.TIMESTAMP};

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
          if (Date.now() - room.timestamps.lastUpdate > 60 * 60 * 1000) {
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