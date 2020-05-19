const database = require('../common/database');
const express = require('express');
const {handleGetRoom} = require('./rooms');

const db = database.getDb();
const router = express.Router({mergeParams: true});

/** ROUTES **/

router.get('/:roomId/:userId', async (req, res) => {
  const {roomId} = req.params;

  let unsubscribe;
  const update = new Promise(resolve => {
    let firstCall = true;
    unsubscribe = db.collection('rooms').doc(roomId).onSnapshot(snap => {
      if (firstCall) {
        firstCall = false;
        return;
      }
      resolve();
    });      
  });

  const timeout = new Promise(resolve => setTimeout(resolve, 530000));

  await Promise.race([update, timeout]);
  unsubscribe();
  handleGetRoom(req, res);
});


module.exports.longPollRouter = router;