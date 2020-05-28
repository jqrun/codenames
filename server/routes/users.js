const db = require('../common/database');
const express = require('express');

const router = express.Router({mergeParams: true});

router.post('/create', async (req, res) => {
  const userId = await db.createUser(req.query);
  if (process.env.NODE_ENV !== 'production') db.createTestUsers(req.query, 2);
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

router.post('/toggle-spymaster', async (req, res) => {
  const toggled = await db.toggleSpymaster(req.query);
  res.json({toggled});
});

module.exports.usersRouter = router;
