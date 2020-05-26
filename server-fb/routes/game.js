const db = require('../common/database');
const express = require('express');

const router = express.Router({mergeParams: true});

router.post('/reveal', async (req, res) => {
  const revealed = await db.revealCard(req.query);
  res.json({revealed});
});


module.exports.gameRouter = router;