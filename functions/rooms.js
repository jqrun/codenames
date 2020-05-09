const db = require('./database').getDb();
const express = require('express');

const router = express.Router();


router.get('/generate-random', (req, res) => {
  res.json({'id': 'generate-random'});
});

router.put('/:roomId', (req, res) => {
  const {roomId} = req.params;

  db.collection('rooms').add({
    roomId: roomId, 
  });

  res.send(req.params.roomId);
});

module.exports = router;