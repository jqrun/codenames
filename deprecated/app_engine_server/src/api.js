const db = require('./database');
const express = require('express');
const logger = require('./logger');

const fs = db.getFirestore();
const router = express.Router({mergeParams: true});

/*** rooms ***/
router.post('/rooms/create', async (req, res) => {
  const {roomId} = req.query;

  const created = await db.createRoom(req.query);
  res.json({'status': created ? 'created': 'already_exists'});
});

/*** users ***/
router.post('/users/create', async (req, res) => {
  const userId = await db.createUser(req.query);
  // if (process.env.NODE_ENV !== 'production') db.createTestUsers(req.query, 2);
  if (!userId) {
    res.json({'status': 'name_taken'});
  } else {
    res.json({'status': 'created', 'userId': userId});
  }
});

router.post('/users/delete', async (req, res) => {
  db.deleteUser(req.query);
  res.json({'status': 'deleted'});
});

router.post('/users/switch-team', async (req, res) => {
  const switched = await db.switchTeam(req.query);
  res.json({switched});
});

router.post('/users/toggle-spymaster', async (req, res) => {
  const toggled = await db.toggleSpymaster(req.query);
  res.json({toggled});
});

/*** game ***/
router.post('/game/reveal', async (req, res) => {
  const revealed = await db.revealCard(req.query);
  res.json({revealed});
});

router.post('/game/end-turn', async (req, res) => {
  const ended = await db.endTurn(req.query);
  res.json({ended});
});

router.post('/game/new-game', async (req, res) => {
  const started = await db.startNewGame(req.query);
  res.json({started});
});


/*** messages ***/
router.post('/messages/create', async (req, res) => {
  const messageId = await db.createMessage(req.query);
  res.json({messageId});
});

/*** admin ***/
async function checkKey({key}) {
  if (!key) return false;
  return (await fs.collection('admin').doc(key).get()).exists;
}

router.post('/admin/rooms', async (req, res) => {
  if (await checkKey(req.body)) {
    const rooms = await db.getRooms();
    res.json({rooms});
  } else {
    res.status(403).send();
  }
});

module.exports = router;