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