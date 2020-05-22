const db = require('../common/database');
const logger = require('../common/logger');
const express = require('express');
const {usersRouter} = require('./users');

const router = express.Router();

// async function getRoom({roomId}) {
//   const room = db.get(roomId);
//   return room;
// }

// async function createRoom({roomId}) {
//   const room =  db.put(room);
//   return room;
// }

/** ROUTES **/

router.post('/create/:roomId', async (req, res) => {
  const {roomId} = req.params;

  if (db.getRoom(req.params)) {
    res.json({'status': 'already_exists'});
    return;
  }

  const room = db.createRoom(req.params);
  res.json({'status': 'created'});
});

router.get('/:roomId', async (req, res) => {
  const room = db.getRoom(req.params);
  res.json({room});  
});

router.use('/:roomId/users', usersRouter);

module.exports.roomsRouter = router;