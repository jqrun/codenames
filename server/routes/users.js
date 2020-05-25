const db = require('../common/database');
const express = require('express');

const router = express.Router({mergeParams: true});

router.post('/create', async (req, res) => {
  const userId = await db.createUser(req.query);
  // db.createTestUsers(req.query, 10);
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


module.exports.usersRouter = router;
