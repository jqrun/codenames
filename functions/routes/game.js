const gameWords = require('../assets/game_words.json');


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

function getRandomWords(words, n) {
  const randomWords = [];
  const picked = {};

  while (n) {
    const pick = words[Math.floor(Math.random() * words.length)];
    if (pick in picked) continue;
    randomWords.push(pick);
    n--;
  }
  return randomWords;
}

function generateNewGame() {
  return getRandomWords(gameWords.english.original, 25);
}
exports.generateNewGame = generateNewGame;