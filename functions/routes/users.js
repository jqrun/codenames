const database = require('../common/database');
const express = require('express');
const {FieldValue} = require('firebase-admin').firestore;

const db = database.getDb();
const router = express.Router({mergeParams: true});

function formatUsers(users) {
  return Object.entries(users).map(([userId, user]) => {
    return {
      userId,
      ...user,
    };
  });
}

async function getUsers({roomId}) {
  const users = (await db.collection('rooms').doc(roomId).get()).data().users;
  return formatUsers(users);
}

async function nameExists({roomId, name}) {
  const users = (await db.collection('rooms').doc(roomId).get()).data().users;
  return Object.values(users).some(user => user.name === name);
}

async function getNextBalancedTeam({roomId}) {
  const users = (await db.collection('rooms').doc(roomId).get()).data().users;
  const numBlue = Object.values(users).filter(user => user.team === 'blue').length;
  const numRed = Object.values(users).filter(user => user.team === 'red').length;

  if (numBlue !== numRed) return numBlue > numRed ? 'red' : 'blue';
  return Math.random() < 0.5 ? 'red': 'blue';
}

async function createUser({roomId, name}) {
  const team = await getNextBalancedTeam({roomId});

  const userId = name.toLowerCase();
  await db.collection('rooms').doc(roomId).update({
    [`users.${userId}`]: {
      name,
      team,
      spymaster: false,
    },
    'timestamps.lastUpdate': FieldValue.serverTimestamp(),
  });

  return userId;
}

async function deleteUser({roomId, userId}) {
  await db.collection('rooms').doc(roomId).update({
    [`users.${userId}`]: FieldValue.delete(),
    'timestamps.lastUpdate': FieldValue.serverTimestamp(),
  });
  cleanUpIfLastuser({roomId});
  return;
}

async function cleanUpIfLastuser({roomId}) {
  const users = (await db.collection('rooms').doc(roomId).get()).data().users;
  if (!Object.keys(users).length) {
    await db.collection('rooms').doc(roomId).delete();
  } 
}


/** ROUTES **/

router.get('/', async (req, res) => {
  const users = await getUsers(req.params);
  res.json({users});
});

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
  formatUsers,
};
