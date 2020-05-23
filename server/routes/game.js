const db = require('../common/database');
const express = require('express');

const router = express.Router({mergeParams: true});

router.post('/:userId/reveal/:cardIndex', async (req, res) => {
  console.log('here at all?');
  const revealed = await db.revealCard(req.params);
  res.json({revealed});
});


module.exports.gameRouter = router;