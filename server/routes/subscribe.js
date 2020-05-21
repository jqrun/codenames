const database = require('../common/database');
const express = require('express');
const logger = require('../common/logger');
const {getRoom} = require('./rooms');

const db = database.getPouchDb();
const router = express.Router({mergeParams: true});

const subscribers = {};


function notifySubscribers(room) {
  if (!room) return;
  if (!subscribers[room._id]) return;
  Object.values(subscribers[room._id]).forEach(res => {
    res.write(`data: ${JSON.stringify(room)}\n\n`);
  });
}

db.changes({
  since: 'now', 
  live: true, 
  include_docs: true
}).on('change', (change) => {
  const room = change.doc;
  notifySubscribers(room);
});

/** ROUTES **/

router.get('/:roomId/:userId', async (req, res) => {
  const {roomId, userId} = req.params;

  const headers = {
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache'
  };
  res.writeHead(200, headers);

  const room = await getRoom(req.params);
  res.write(`data: ${JSON.stringify(room)}\n\n`);

  const subscriber = {userId, res};
  subscribers[roomId] = subscribers[roomId] || {};
  subscribers[roomId][userId] = res;

  req.on('close', () => {
    subscribers[roomId] = subscribers[roomId] || {};
    delete subscribers[roomId][userId];
  });
});

module.exports.subscribeRouter = router;