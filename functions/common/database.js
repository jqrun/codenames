const admin = require('firebase-admin');

class Database {
  constructor() {
    admin.initializeApp();

    this.db = admin.firestore();

    this.pubSub = {};
  }

  getDb() {
    return this.db;
  }

  subscribe({roomId, collection}) {
    this.pubSub[roomId] = this.pubSub[roomId] || {}; 
    if (typeof this.pubSub[roomId][collection] === 'undefined') {
      this.pubSub[roomId][collection] = (() => {
        let toResolve;
        const resolvePromise = () => toResolve();
        const promise = new Promise(resolve => {
          toResolve = resolve;
        });
        return {promise, resolvePromise};
      })();
    }
    console.log(this.pubSub);
    return this.pubSub[roomId][collection].promise;
  };

  publish({roomId, collection}) {
    console.log('attempting to publish');
    console.log(this.pubSub);
    this.pubSub[roomId] = this.pubSub[roomId] || {}; 
    if (typeof this.pubSub[roomId][collection] !== 'undefined') {
      console.log('we are here');
      this.pubSub[roomId][collection].resolvePromise();
      delete this.pubSub[roomId][collection];
    }
  }

  removePubSub({roomId}) {
    if (this.pubSub[roomId] !== 'undefined') delete this.pubSub[roomId];
  }
}

module.exports = new Database();