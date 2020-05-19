const database = require('../common/database');
const express = require('express');
const hridWords = require('../assets/human_readable_id_words.json');
const {FieldValue} = require('firebase-admin').firestore;
const {gameRouter, generateNewGame} = require('./game');
const {formatUsers, usersRouter} = require('./users');

const db = database.getDb();
const router = express.Router();

function generateRandomId() {
  const adjectives = hridWords.adjectives;
  const nouns = hridWords.nouns;

  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomNumber = Math.floor(Math.random() * 10);

  return`${randomAdjective}-${randomNoun}-${randomNumber}`;
}

async function getRoom({roomId}) {
  const roomDoc = await db.collection('rooms').doc(roomId).get();
  if (!roomDoc.exists) return null;

  const room = roomDoc.data();
  room.users = formatUsers(room.users);
  return room;
}

async function createRoom({roomId}) {
  try {
    await db.collection('rooms').doc(roomId).set({
      game: generateNewGame(),
      users: {},
      messages: {},
      timestamps: {
        created: FieldValue.serverTimestamp(),
        lastUpdate: FieldValue.serverTimestamp(),
      },
    });
    return true;
  } catch {
    return false;
  }
}

async function roomExists({roomId}) {
  return (await db.collection('rooms').doc(roomId).get()).exists;
}

/** ROUTES **/

router.get('/generate-random', (req, res) => {
  res.json({'name': generateRandomId()});
});

router.post('/create/:roomId', async (req, res) => {
  const {roomId} = req.params;

  if (await roomExists(req.params)) {
    res.json({'status': 'already_exists'});
    return;
  }

  const created = await createRoom(req.params);
  res.json({'status': created ? 'created' : 'failed'});
});

async function handleGetRoom (req, res) {
  const room = await getRoom(req.params);
  res.json({room});
}
router.get('/:roomId', handleGetRoom);


router.use('/:roomId/game', gameRouter);
router.use('/:roomId/users', usersRouter);

module.exports = {
  roomsRouter: router,
  handleGetRoom,
};