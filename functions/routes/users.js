const database = require('../common/database');
const express = require('express');

const db = database.getDb();
const router = express.Router({mergeParams: true});

async function getUsers({roomId}) {
  const users = await db.collection('rooms').doc(roomId).collection('users').get();
  return users.docs.map(user => {
    return {
      userId: user.id,
      ...user.data(),
    };
  });
}

async function nameExists({roomId, name}) {
  const user = await db.collection('rooms').doc(roomId).collection('users')
      .where('nameCaseInsensitive', '==', name.toLowerCase()).get();
  return !user.empty;
}

async function createUser({roomId, name}) {
  const user = await db.collection('rooms').doc(roomId).collection('users').add({
    name,
    nameCaseInsensitive: name.toLowerCase(),
    team: null,
    spymaster: false,
  });
  return user.id;
}

async function deleteUser({roomId, userId}) {
  await db.collection('rooms').doc(roomId).collection('users').doc(userId).delete();
  cleanUpIfLastuser({roomId});
  return;
}

async function cleanUpIfLastuser({roomId}) {
  const users = await db.collection('rooms').doc(roomId).collection('users').get();
  if (users.empty) {
    await db.collection('rooms').doc(roomId).delete();
  } 
}


/** ROUTES **/

const handleGetUsers = async (req, res) => {
  const users = await getUsers(req.params);
  res.json({users});
};
router.get('/', handleGetUsers);

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

router.post('/delete', async (req, res) => {
  await cleanUpIfLastuser(req.params);
  res.json({'status': 'deleted'});
});


module.exports = {
  usersRouter: router,
  handleGetUsers,
};