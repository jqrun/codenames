const db = require('../common/database').getDb();
const express = require('express');
const hridWords = require('../assets/human_readable_id_words.json');

const router = express.Router();

router.get('/generate-random', (req, res) => {
  const adjectives = hridWords.adjectives;
  const nouns = hridWords.nouns;

  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomNumber = Math.floor(Math.random() * 10);
  const randomRoomName = `${randomAdjective}-${randomNoun}-${randomNumber}`;

  res.json({'name': randomRoomName});
});

router.put('/:roomId', (req, res) => {
  const {roomId} = req.params;
  const now = new Date();

  db.collection('rooms').add({
    roomId: roomId,
    lastUpdated: {
      timestamp: Number(now),
      localeString: `${now.toLocaleString("en-US", {timeZone: "America/New_York"})} EST`,
    }
  });

  res.send(req.params.roomId);
});

module.exports = router;