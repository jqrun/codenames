const database = require('../database');
const express = require('express');
const gameWords = require('../assets/game_words.json');

const db = database.getPouchDb();
const router = express.Router({mergeParams: true});


function getRandomWords(words, numWords) {
  const randomWords = [];
  const picked = new Set();

  while (numWords) {
    const pick = words[Math.floor(Math.random() * words.length)];
    if (picked.has(pick)) continue;
    randomWords.push(pick);
    picked.add(pick);
    numWords--;
  }
  return randomWords;
}

function assignRandomCards(words, numAgents) {
  const cards = words.map(word => {
    return {word, type: 'bystander', revealed :false}
  });
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

  return {...cards};
}

function generateNewGame() {
  const randomWords =  getRandomWords(gameWords.english.original, 25);
  const cards = assignRandomCards(randomWords, 17);
  return {
    board: cards,
  };
}

/** ROUTES **/

// TODO
// router.get('/', async (req, res) => {
//   const {roomId} = req.params;

//   const doc = await db.collection('rooms').doc(roomId).get();
//   if (!doc.exists) {
//     res.json({game: undefined});
//     return;
//   }

//   const game = doc.data().game;
//   res.json({game});
// });


module.exports = {
  gameRouter: router,
  generateNewGame,
}