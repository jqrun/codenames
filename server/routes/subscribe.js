const db = require('../common/database');
const express = require('express');
const logger = require('../common/logger');
const {encrypt} = require('../common/util');

const router = express.Router({mergeParams: true});

const longPollers = {};
const subscribers = {};

function notifySubscribers(room) {
  if (!room) return;
  const {roomId} = room;
  if (longPollers[roomId]) {
    Object.entries(longPollers[roomId]).forEach(([key, res]) => {
      delete longPollers[roomId][key];
      res.json({data: encrypt({room})});
    });
  }

  if (subscribers[roomId]) {
    Object.values(subscribers[roomId]).forEach(res => {
      res.write(`data: ${JSON.stringify(room)}\n\n`);
    });
  };
}

function timeoutLongPoll({roomId, userId}) {
  const room = db.getRoom({roomId});
  if (longPollers[roomId] && longPollers[roomId][userId]) {
    const res = longPollers[roomId][userId];
    delete longPollers[roomId][userId];
    res.json({data: encrypt({room})});
  }
}

db.watchUpdates((room, type) => {
  switch (type) {
    case 'update':
      notifySubscribers(room);
      break;
    case 'delete':
      delete longPollers[room.roomId];
      delete subscribers[room.roomId];
      break;
    default:
  }
});

router.get('/poll/:roomId/:userId/:lastUpdate', async (req, res) => {
  const {lastUpdate} = req.params;
  const room = db.getRoom(req.params);
  const updated = Number(lastUpdate) !== room.timestamps.lastUpdate;
  res.json({data: encrypt({updated, room: updated ? room : null})});
});

router.get('/long-poll/:roomId/:userId', async (req, res) => {
  const {roomId, userId} = req.params;
  const poller = {userId, res};
  longPollers[roomId] = longPollers[roomId] || {};
  longPollers[roomId][userId] = res;
  setTimeout(() => timeoutLongPoll(req.params), 30000);
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