const db = require('../common/database');
const express = require('express');
const gameWords = require('../assets/game_words.json');

const router = express.Router({mergeParams: true});

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


module.exports.gameRouter = router;