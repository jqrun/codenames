const db = require('../common/database').getDb();
const express = require('express');

const router = express.Router({mergeParams: true});

async function nameExists({roomId, name}) {
  const query = await db.collection('rooms').doc(roomId)
                        .collection('users').where('name', '==', name).get();
  return !query.empty;
}

async function createUser({roomId, name}) {
  const doc = await db.collection('rooms').doc(roomId).collection('users').add({
    name,
    team: null,
    spymaster: false,
  });
  return doc.id;
}

async function deleteUser({roomId, userId}) {
  return db.collection('rooms').doc(roomId).collection('users').doc(userId).delete();
}


/** ROUTES **/

router.post('/create/:name', async (req, res) => {
  const {roomId} = req.params;

  if (await nameExists(req.params)) {
    res.json({'status': 'name_taken'});
    return;
  }

  const userId = await createUser(req.params);
  res.json({'status': 'created', 'userId': userId});
});

router.post('/delete/:userId', async (req, res) => {
  await deleteUser(req.params);
  res.json({'status': 'deleted'});
});


module.exports.usersRouter = router;