const db = require('../common/database');
const express = require('express');
const logger = require('../common/logger');
const {encrypt} = require('../common/util');
const {gameRouter} = require('./game');
const {usersRouter} = require('./users');

const router = express.Router();

router.post('/create', async (req, res) => {
  const {roomId} = req.query;

  if (db.getRoom(req.query)) {
    res.json({'status': 'already_exists'});
    return;
  }

  const room = await db.createRoom(req.query);
  res.json({'status': 'created'});
});

router.get('/', async (req, res) => {
  const room = db.getRoom(req.query);
  res.json({data: encrypt({room})});  
});

router.use('/:roomId/users', usersRouter);
router.use('/:roomId/game', gameRouter);

module.exports.roomsRouter = router;