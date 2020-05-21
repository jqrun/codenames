const database = require('../common/database');
const express = require('express');

const db = database.getPouchDb();
const router = express.Router({mergeParams: true});

async function nameExists({roomId, name}) {
  const users = (await db.get(roomId)).users;
  return Object.values(users).some(user => user.name === name);
}

async function getNextBalancedTeam({roomId}) {
  const users = (await db.get(roomId)).users;
  const numBlue = Object.values(users).filter(user => user.team === 'blue').length;
  const numRed = Object.values(users).filter(user => user.team === 'red').length;

  if (numBlue !== numRed) return numBlue > numRed ? 'red' : 'blue';
  return Math.random() < 0.5 ? 'red': 'blue';
}

async function createUser({roomId, name}) {
  const team = await getNextBalancedTeam({roomId});

  const room = await db.get(roomId);
  const userId = database.getUniqueId();
  room.users[userId] = {
      name,
      team,
      spymaster: false,
  };
  room.timestamps.lastUpdate = Number(new Date());
  try {
    await db.put(room);
  } catch(err) {
    createUser({roomId, name});
  }
  return userId;
}

async function deleteUser({roomId, userId}) {
  const room = await db.get(roomId);
  if (!room.users[userId]) return;

  delete room.users[userId];
  room.timestamps.lastUpdate = Number(new Date());
  try {
    await db.put(room);
  } catch(err) {
    deleteUser({roomId, userId});
  }
}

async function cleanUpIfLastuser({roomId}) {
  // MAYBE TODO
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

// router.post('/delete', async (req, res) => {
//   await cleanUpIfLastuser(req.params);
//   res.json({'status': 'deleted'});
// });


module.exports.usersRouter = router;
