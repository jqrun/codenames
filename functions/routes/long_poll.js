const database = require('../common/database');
const express = require('express');
const {handleGetUsers} = require('./users');

const db = database.getDb();
const router = express.Router({mergeParams: true});



/** ROUTES **/

router.get('/:roomId/:userId/users', async (req, res) => {
  const {roomId} = req.params;

  let unsubscribe;
  const update = new Promise(resolve => {
    let firstCall = true;
    unsubscribe = db.collection('rooms').doc(roomId).collection('users').onSnapshot(snap => {
      if (firstCall) {
        firstCall = false;
        return;
      }
      resolve();
    });      
  });

  const timeout = new Promise(resolve => setTimeout(resolve, 58000));

  await Promise.race([update, timeout]);
  unsubscribe();
  handleGetUsers(req, res);
});


module.exports.longPollRouter = router;