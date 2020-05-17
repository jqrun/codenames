const database = require('../common/database');
const express = require('express');
const {handleGetUsers} = require('./users');

const router = express.Router({mergeParams: true});



/** ROUTES **/

router.get('/users', async (req, res) => {
  const {roomId} = req.params;
  const collection = 'users';
  // setTimeout(() => {
  //   database.publish({roomId, collection});
  // }, 5000);
  await database.subscribe({roomId, collection});
  // handleGetUsers(req, res);
  res.json({'status': 'update'});
});


module.exports.longPollRouter = router;