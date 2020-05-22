const db = require('../common/database');
const logger = require('../common/logger');
const express = require('express');
const {usersRouter} = require('./users');

const router = express.Router();

router.post('/create/:roomId', async (req, res) => {
  const {roomId} = req.params;

  if (db.getRoom(req.params)) {
    res.json({'status': 'already_exists'});
    return;
  }

  const room = await db.createRoom(req.params);
  res.json({'status': 'created'});
});

router.get('/:roomId', async (req, res) => {
  const room = db.getRoom(req.params);
  res.json({room});  
});

router.use('/:roomId/users', usersRouter);

module.exports.roomsRouter = router;