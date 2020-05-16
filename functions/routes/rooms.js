const db = require('../common/database').getDb();
const express = require('express');
const hridWords = require('../assets/human_readable_id_words.json');
const {gameRouter, generateNewGame} = require('./game');
const {usersRouter} = require('./users');

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
  const room = await db.collection('rooms').doc(roomId).get();
  return room.data();
}

async function createRoom({roomId}) {
  const now = new Date();

  try {
    await db.collection('rooms').doc(roomId).set({
      game: generateNewGame(),
      lastUpdated: {
        timestamp: Number(now),
        localeString: `${now.toLocaleString("en-US", {timeZone: "America/New_York"})} EST`,
      },
    });
    return true;
  } catch {
    return false;
  }
}

async function roomExists({roomId}) {
  const room = await db.collection('rooms').doc(roomId).get();
  return room && room.exists;
}

/** ROUTES **/

router.get('/generate-random', (req, res) => {
  res.json({'name': generateRandomId()});
});

router.get('/:roomId', async (req, res) => {
  const room = await getRoom(req.params);
  res.json({room});
});

router.post('/create/:roomId', async (req, res) => {
  if (await roomExists(req.params)) {
    res.json({'status': 'already_exists'});
    return;
  }

  const created = await createRoom(req.params);
  res.json({'status': created ? 'created' : 'failed'});
});

router.use('/:roomId/game', gameRouter);
router.use('/:roomId/users', usersRouter);

module.exports = router;