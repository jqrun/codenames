const db = require('../common/database');
const express = require('express');

const router = express.Router({mergeParams: true});

router.post('/:userId/reveal/:cardIndex', async (req, res) => {
  console.log('1');
  const revealed = await db.revealCard(req.params);
  console.log('2');
  res.json({revealed});
});


module.exports.gameRouter = router;