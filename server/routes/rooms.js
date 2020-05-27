const db = require('../common/database');
const express = require('express');
const logger = require('../common/logger');

const router = express.Router();

router.post('/create', async (req, res) => {
  const {roomId} = req.query;

  const created = await db.createRoom(req.query);
  res.json({'status': created ? 'created': 'already_exists'});
});

module.exports.roomsRouter = router;