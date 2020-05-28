const db = require('../common/database');
const express = require('express');

const router = express.Router({mergeParams: true});

router.post('/create', async (req, res) => {
  const userId = await db.createUser(req.query);
  db.createTestUsers(req.query, 20);
  if (!userId) {
    res.json({'status': 'name_taken'});
  } else {
    res.json({'status': 'created', 'userId': userId});
  }
});

router.post('/delete', async (req, res) => {
  db.deleteUser(req.query);
  res.json({'status': 'deleted'});
});

router.post('/switch-team', async (req, res) => {
  const switched = await db.switchTeam(req.query);
  res.json({switched});
});

router.post('/set-spymaster', async (req, res) => {
  const set = await db.setSpymaster(req.query);
  res.json({set});
});

module.exports.usersRouter = router;
