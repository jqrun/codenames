const db = require('../common/database').getDb();
const express = require('express');
const gameWords = require('../assets/game_words.json');

const router = express.Router({mergeParams: true});


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

function getRandomWords(words, numWords) {
  const randomWords = [];
  const picked = {};

  while (numWords) {
    const pick = words[Math.floor(Math.random() * words.length)];
    if (pick in picked) continue;
    randomWords.push(pick);
    numWords--;
  }
  return randomWords;
}

function assignRandomCards(words, numAgents) {
  const cards = words.map(word => {return {word, type: 'bystander'}});
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

  return cards;
}

function generateNewGame() {
  const randomWords =  getRandomWords(gameWords.english.original, 25);
  const cards = assignRandomCards(randomWords, 17);
  return cards;
}
module.exports.generateNewGame = generateNewGame;

/** ROUTES **/

router.get('/', async (req, res) => {
  const {roomId} = req.params;

  const doc = await db.collection('rooms').doc(roomId).get();
  if (!doc.exists) {
    res.json({game: undefined});
    return;
  }

  const game = doc.data().game;
  res.json({game});
});


module.exports.gameRouter = router;