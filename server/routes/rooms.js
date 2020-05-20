const database = require('../database');
const express = require('express');
const hridWords = require('../assets/human_readable_id_words.json');

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
  } catch {
    return null;
  }
}

async function createRoom({roomId}) {
  const now = Number(Date.now());
  const room = {
    _id: roomId,
    users: {},
    messages: {},
    timestamps: {
      created: now,
      lastUpdate: now,
    },
  };
  const response = await db.put(room);
  return room;
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

  const room = await createRoom(req.params);
  res.json({'status': room ? 'created' : 'failed'});
});

async function handleGetRoom (req, res) {
  const room = await getRoom(req.params);
  res.json({room});
}
router.get('/:roomId', handleGetRoom);

module.exports = {
  roomsRouter: router,
  handleGetRoom,
};