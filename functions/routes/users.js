const db = require('../common/database').getDb();
const express = require('express');

const router = express.Router({mergeParams: true});

// async function nicknameTaken = ({nickname, roomId}}) => {
//   const doc = await db.collection('rooms').doc(roomId)
// };

async function createUser({roomId, nickname}) {
  const doc = await db.collection('rooms').doc(roomId).collection('users').add({
    nickname,
    team: null,
    spymaster: false,
  });
  // const userId = 
}


/** ROUTES **/

router.post('/create/:nickname', async (req, res) => {
  const {roomId, nickname} = req.params;
  await createUser({roomId, nickname});
  res.json({'status': 'created'});
});


module.exports.usersRouter = router;