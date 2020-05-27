const db = require('../common/database');
const express = require('express');

const router = express.Router({mergeParams: true});

router.post('/reveal', async (req, res) => {
  const revealed = await db.revealCard(req.query);
  res.json({revealed});
});

router.post('/end-turn', async (req, res) => {
  const ended = await db.endTurn(req.query);
  res.json({ended});
});

router.post('/new-game', async (req, res) => {
  const started = await db.startNewGame(req.query);
  res.json({started});
});


module.exports.gameRouter = router;