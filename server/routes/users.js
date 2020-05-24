const db = require('../common/database');
const express = require('express');

const router = express.Router({mergeParams: true});

router.post('/create/:name', async (req, res) => {
  const {roomId} = req.params;

  const userId = await db.createUser(req.params);
  // db.createTestUsers(req.params);
  if (!userId) {
    res.json({'status': 'name_taken'});
  } else {
    res.json({'status': 'created', 'userId': userId});
  }
});

router.post('/delete/:userId', async (req, res) => {
  db.deleteUser(req.params);
  res.json({'status': 'deleted'});
});


module.exports.usersRouter = router;
