const db = require('../common/database');
const express = require('express');
const logger = require('../common/logger');

const router = express.Router({mergeParams: true});

const subscribers = {};

function notifySubscribers(room) {
  if (!room) return;
  if (!subscribers[room.roomId]) return;
  Object.values(subscribers[room.roomId]).forEach(res => {
    res.write(`data: ${JSON.stringify(room)}\n\n`);
  });
}

db.watchUpdates((room) => {
  notifySubscribers(room);
});

router.get('/:roomId/:userId', async (req, res) => {
  const {roomId, userId} = req.params;

  const headers = {
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache'
  };
  res.writeHead(200, headers);

  const room = db.getRoom(req.params);
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