const database = require('../common/database');
const logger = require('../common/logger');
const express = require('express');
const hridWords = require('../assets/human_readable_id_words.json');
const {generateNewGame} = require('./game');
const {usersRouter} = require('./users');

const db = database.getPouchDb();
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
  try {
    const room = await db.get(roomId);
    return room;
  } catch(err) {
    return null;
  }
}

async function createRoom({roomId}) {
  const now = Number(Date.now());
  const room = {
    _id: roomId,
    users: {},
    messages: {},
    game: generateNewGame(),
    timestamps: {
      created: now,
      lastUpdate: now,
      lastFirebaseCommit: null,
    },
  };
  try {
    const response = await db.put(room);
    return room;
  } catch (err) {
    throw Error(err);
  }
}

/** ROUTES **/

router.get('/generate-random', (req, res) => {
  res.json({'name': generateRandomId()});
});

router.post('/create/:roomId', async (req, res) => {
  const {roomId} = req.params;

  if (await getRoom(req.params)) {
    res.json({'status': 'already_exists'});
    return;
  }

  try {
    const room = await createRoom(req.params);
    res.json({'status': 'created'});
  } catch (err) {
    logger.reqError(req, err);
    res.json({'status': 'failed'});
  }
});

router.get('/:roomId', async (req, res) => {
  const room = await getRoom(req.params);
  res.json({room});  
});

router.use('/:roomId/users', usersRouter);

module.exports = {roomsRouter: router, getRoom};