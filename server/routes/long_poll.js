const database = require('../database');
const express = require('express');
const {handleGetRoom} = require('./rooms');

const db = database.getPouchDb();
const router = express.Router({mergeParams: true});

/** ROUTES **/

router.get('/:roomId/:userId', async (req, res) => {
  const {roomId} = req.params;

  let changes;
  const update = new Promise(resolve => {
    let firstCall = true;
    changes = db.changes({doc_ids: [roomId], live: true}).on('change', () => {
      if (firstCall) {
        firstCall = false;
        return;
      }
      resolve();
    });
  });

  const timeout = new Promise(resolve => setTimeout(resolve, 120000));

  await Promise.race([update, timeout]);
  changes.cancel();
  handleGetRoom(req, res);
});

module.exports.longPollRouter = router;