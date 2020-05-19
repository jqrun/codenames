const express = require('express');
const hridWords = require('../assets/human_readable_id_words.json');

const router = express.Router();

function generateRandomId() {
  const adjectives = hridWords.adjectives;
  const nouns = hridWords.nouns;

  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomNumber = Math.floor(Math.random() * 10);

  return`${randomAdjective}-${randomNoun}-${randomNumber}`;
}

/** ROUTES **/

router.get('/generate-random', (req, res) => {
  res.json({'name': generateRandomId()});
});


module.exports = {
  roomsRouter: router,
};