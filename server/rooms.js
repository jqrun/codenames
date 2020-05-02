const express = require('express');

const router = express.Router();

router.get('/generate-random', (req, res) => {
  res.json({'id': 'generate-random'});
});

module.exports = router;