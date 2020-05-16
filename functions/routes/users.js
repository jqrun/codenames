const db = require('../common/database').getDb();
const express = require('express');

const router = express.Router({mergeParams: true});

async function nicknameExists({roomId, nickname}) {
  const query = await db.collection('rooms').doc(roomId)
                        .collection('users').where('nickname', '==', nickname).get();
                        console.log(query.empty);
  return !query.empty;
}

async function createUser({roomId, nickname}) {
  const doc = await db.collection('rooms').doc(roomId).collection('users').add({
    nickname,
    team: null,
    spymaster: false,
  });
  return doc.id;
}


/** ROUTES **/

router.post('/create/:nickname', async (req, res) => {
  const {roomId, nickname} = req.params;

  if (await nicknameExists({roomId, nickname})) {
    res.json({'status': 'nickname_taken'});
    return;
  }

  const userId = await createUser({roomId, nickname});
  res.json({'status': 'created', 'userId': userId});
});


module.exports.usersRouter = router;