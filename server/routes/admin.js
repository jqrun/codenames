const db = require('../common/database');
const express = require('express');

const fs = db.getFirestore();
const router = express.Router({mergeParams: true});
router.use(express.json());


async function checkKey({key}) {
  if (!key) return false;
  return (await fs.collection('admin').doc(key).get()).exists;
}

/** ROUTES **/

router.post('/rooms', async (req, res) => {
  if (await checkKey(req.body)) {
    const rooms = db.getRooms();
    res.json({rooms});
  } else {
    res.status(403).send();
  }
});


module.exports.adminRouter = router;
