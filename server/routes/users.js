const db = require('../common/database');
const express = require('express');

const router = express.Router({mergeParams: true});

router.post('/create/:name', async (req, res) => {
  const {roomId} = req.params;

  if (db.nameExists(req.params)) {
    res.json({'status': 'name_taken'});
    return;
  }

  const userId = db.addUser(req.params);
  res.json({'status': 'created', 'userId': userId});
});

router.post('/delete/:userId', async (req, res) => {
  db.removeUser(req.params);
  res.json({'status': 'deleted'});
});


module.exports.usersRouter = router;
