const db = require('../common/database').getDb();
const express = require('express');
const gameWords = require('../assets/game_words.json');
const hridWords = require('../assets/human_readable_id_words.json');

const router = express.Router();


// const tempGame = {
//   board: [
//     {
//       word,
//       type,
//       revealed,
//     },
//   ],
//   turn,
//   blue: {
//     score,
//   },
//   red: {
//     score,
//   },
// };

function generateNewGame() {
  return {

  };
}

function generateRandomId() {
  const adjectives = hridWords.adjectives;
  const nouns = hridWords.nouns;

  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomNumber = Math.floor(Math.random() * 10);

  return`${randomAdjective}-${randomNoun}-${randomNumber}`;
}

async function createRoom(roomId) {
  const now = new Date();

  try {
    await db.collection('rooms').doc(roomId).set({
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

async function roomExists(roomId) {
  const doc = await db.collection('rooms').doc(roomId).get();
  return doc.exists;
}

/** ROUTES **/

router.get('/generate-random', (req, res) => {
  res.json({'name': generateRandomId()});
});

router.post('/create/:roomId', async (req, res) => {
  const {roomId} = req.params;

  if (await roomExists(roomId)) {
    res.json({'status': 'already_exists'});
    return;
  }

  const created = await createRoom(roomId);
  res.json({'status': created ? 'created' : 'failed'});
});

module.exports = router;